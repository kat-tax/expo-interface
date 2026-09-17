#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

#if __has_include(<winrt/Microsoft.Windows.Media.Capture.h>)
#include <winrt/Microsoft.Windows.Media.Capture.h>
#define EXPO_WINDOWS_CAMERA_CAPTURE 1
#endif

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Foundation;
using namespace winrt::Windows::Graphics::Imaging;
using namespace winrt::Windows::Security::Cryptography;
using namespace winrt::Windows::Storage;
using namespace winrt::Windows::Storage::Streams;
using namespace ExpoWindows;

namespace fs = std::filesystem;

namespace {

fs::path PathOf(std::string const &uri) {
  std::wstring path = PathFromUri(uri);
  if (path.empty()) throw hresult_invalid_argument(L"Not a file path: " + to_hstring(uri));
  return fs::path(path);
}

std::string UriOf(fs::path const &path) {
  std::string generic = ToUtf8(path.generic_wstring());
  std::string out = "file:///";
  for (unsigned char c : generic) {
    if (std::isalnum(c) || c == '/' || c == ':' || c == '-' || c == '_' || c == '.' || c == '~') out += static_cast<char>(c);
    else {
      char escaped[4];
      std::snprintf(escaped, sizeof(escaped), "%%%02X", c);
      out += escaped;
    }
  }
  return out;
}

/** `%LOCALAPPDATA%\<the exe's name>\cache\<folder>`, created. */
fs::path CacheFolder(wchar_t const *folder) {
  PWSTR local = nullptr;
  check_hresult(SHGetKnownFolderPath(FOLDERID_LocalAppData, 0, nullptr, &local));
  fs::path directory(local);
  CoTaskMemFree(local);
  wchar_t exe[MAX_PATH]{};
  GetModuleFileNameW(nullptr, exe, MAX_PATH);
  auto path = directory / fs::path(exe).stem() / L"cache" / folder;
  std::error_code error;
  fs::create_directories(path, error);
  return path;
}

std::wstring NewName(wchar_t const *extension) {
  GUID guid{};
  CoCreateGuid(&guid);
  wchar_t text[64]{};
  StringFromGUID2(guid, text, 64);
  std::wstring name(text + 1, wcslen(text) - 2);
  return name + extension;
}

/** The encoder for a format `expo-image-manipulator` names, and its extension. */
std::pair<winrt::guid, wchar_t const *> EncoderFor(std::string const &format) {
  if (format == "png") return {BitmapEncoder::PngEncoderId(), L".png"};
  if (format == "webp") throw hresult_error(E_FAIL, L"Windows encodes JPEG and PNG; WebP is not available");
  return {BitmapEncoder::JpegEncoderId(), L".jpg"};
}

/** The bitmap encoded as PNG into memory, to decode again with the next transform. */
IAsyncOperation<IRandomAccessStream> EncodeToMemory(SoftwareBitmap bitmap) {
  InMemoryRandomAccessStream stream;
  auto encoder = co_await BitmapEncoder::CreateAsync(BitmapEncoder::PngEncoderId(), stream);
  encoder.SetSoftwareBitmap(bitmap);
  co_await encoder.FlushAsync();
  stream.Seek(0);
  co_return stream;
}

/** The decoder's bitmap through one transform, in a format any encoder takes. */
IAsyncOperation<SoftwareBitmap> Transformed(BitmapDecoder decoder, BitmapTransform transform) {
  co_return co_await decoder.GetSoftwareBitmapAsync(
      BitmapPixelFormat::Bgra8, BitmapAlphaMode::Premultiplied, transform, ExifOrientationMode::RespectExifOrientation, ColorManagementMode::DoNotColorManage);
}

/** One of the package's actions as a transform over the current size; the size it leaves. */
BitmapTransform TransformFor(JSValueObject const &action, uint32_t width, uint32_t height) {
  BitmapTransform transform;
  if (action.find("resize") != action.end()) {
    auto const &size = action.at("resize").AsObject();
    double w = size.find("width") != size.end() && size.at("width").Type() != JSValueType::Null ? size.at("width").AsDouble() : 0;
    double h = size.find("height") != size.end() && size.at("height").Type() != JSValueType::Null ? size.at("height").AsDouble() : 0;
    if (w <= 0 && h <= 0) return transform;
    if (w <= 0) w = h * width / height;
    if (h <= 0) h = w * height / width;
    transform.ScaledWidth(static_cast<uint32_t>(std::lround(w)));
    transform.ScaledHeight(static_cast<uint32_t>(std::lround(h)));
    transform.InterpolationMode(BitmapInterpolationMode::Fant);
  } else if (action.find("crop") != action.end()) {
    auto const &rect = action.at("crop").AsObject();
    BitmapBounds bounds{
        static_cast<uint32_t>(std::max(0.0, rect.at("originX").AsDouble())),
        static_cast<uint32_t>(std::max(0.0, rect.at("originY").AsDouble())),
        static_cast<uint32_t>(std::max(0.0, rect.at("width").AsDouble())),
        static_cast<uint32_t>(std::max(0.0, rect.at("height").AsDouble())),
    };
    if (bounds.X + bounds.Width > width || bounds.Y + bounds.Height > height) throw hresult_invalid_argument(L"The crop rectangle is out of the image");
    transform.Bounds(bounds);
  } else if (action.find("rotate") != action.end()) {
    int degrees = static_cast<int>(std::lround(action.at("rotate").AsDouble())) % 360;
    if (degrees < 0) degrees += 360;
    if (degrees == 90) transform.Rotation(BitmapRotation::Clockwise90Degrees);
    else if (degrees == 180) transform.Rotation(BitmapRotation::Clockwise180Degrees);
    else if (degrees == 270) transform.Rotation(BitmapRotation::Clockwise270Degrees);
    else if (degrees != 0) throw hresult_invalid_argument(L"Windows rotates images by quarter turns: 90, 180 or 270 degrees");
  } else if (action.find("flip") != action.end()) {
    transform.Flip(action.at("flip").AsString() == "vertical" ? BitmapFlip::Vertical : BitmapFlip::Horizontal);
  } else if (action.find("extent") != action.end()) {
    throw hresult_invalid_argument(L"extent is a web action");
  }
  return transform;
}

} // namespace

/**
 * `ExpoWindowsImages`: what the image packages decode, transform, encode
 * and capture through — `expo-image-picker`'s sizes and camera,
 * `expo-image-manipulator`'s resize, crop, rotate and flip — over
 * `Windows.Graphics.Imaging` (the system's codecs: JPEG, PNG, GIF, BMP,
 * TIFF, WebP and HEIF to decode; JPEG and PNG to encode) and the Windows
 * App SDK's camera capture UI.
 */
REACT_MODULE(ExpoWindowsImages)
struct ExpoWindowsImages {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
  }

  REACT_METHOD(Info, L"info")
  fire_and_forget Info(std::string uri, ReactPromise<JSValue> promise) noexcept {
    try {
      auto path = PathOf(uri);
      auto stream = co_await FileRandomAccessStream::OpenAsync(path.c_str(), FileAccessMode::Read);
      auto decoder = co_await BitmapDecoder::CreateAsync(stream);
      promise.Resolve(JSValueObject{{"width", static_cast<int>(decoder.OrientedPixelWidth())}, {"height", static_cast<int>(decoder.OrientedPixelHeight())}});
      stream.Close();
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  /** The image through the actions, encoded as asked into the cache; `compress` is the JPEG quality. */
  REACT_METHOD(Manipulate, L"manipulate")
  fire_and_forget Manipulate(std::string uri, JSValue actions, std::string format, double compress, bool base64, ReactPromise<JSValue> promise) noexcept {
    try {
      auto path = PathOf(uri);
      auto stream = co_await FileRandomAccessStream::OpenAsync(path.c_str(), FileAccessMode::Read);
      auto decoder = co_await BitmapDecoder::CreateAsync(stream);
      auto bitmap = co_await Transformed(decoder, BitmapTransform{});
      stream.Close();
      if (actions.Type() == JSValueType::Array) {
        for (auto const &action : actions.AsArray()) {
          auto transform = TransformFor(action.AsObject(), static_cast<uint32_t>(bitmap.PixelWidth()), static_cast<uint32_t>(bitmap.PixelHeight()));
          auto memory = co_await EncodeToMemory(bitmap);
          auto again = co_await BitmapDecoder::CreateAsync(memory);
          bitmap = co_await Transformed(again, transform);
        }
      }
      auto [encoderId, extension] = EncoderFor(format);
      auto target = CacheFolder(L"ImageManipulator") / NewName(extension);
      auto output = co_await FileRandomAccessStream::OpenAsync(target.c_str(), FileAccessMode::ReadWrite, StorageOpenOptions::None, FileOpenDisposition::CreateAlways);
      BitmapPropertySet properties;
      if (encoderId == BitmapEncoder::JpegEncoderId()) {
        properties.Insert(L"ImageQuality", BitmapTypedValue(box_value(static_cast<float>(std::clamp(compress, 0.0, 1.0))), winrt::Windows::Foundation::PropertyType::Single));
      }
      auto encoder = co_await BitmapEncoder::CreateAsync(encoderId, output, properties);
      encoder.SetSoftwareBitmap(bitmap);
      co_await encoder.FlushAsync();
      JSValueObject result{{"uri", UriOf(target)}, {"width", bitmap.PixelWidth()}, {"height", bitmap.PixelHeight()}};
      if (base64) {
        output.Seek(0);
        Buffer buffer(static_cast<uint32_t>(output.Size()));
        co_await output.ReadAsync(buffer, buffer.Capacity(), InputStreamOptions::None);
        result["base64"] = to_string(CryptographicBuffer::EncodeToBase64String(buffer));
      }
      output.Close();
      promise.Resolve(std::move(result));
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  /** The camera capture UI for the app's window: a photo (or a video), or nothing when the user leaves it. */
  REACT_METHOD(Capture, L"capture")
  void Capture(bool video, ReactPromise<JSValue> promise) noexcept {
#ifdef EXPO_WINDOWS_CAMERA_CAPTURE
    m_context.UIDispatcher().Post([video, promise]() -> fire_and_forget {
      try {
        HWND window = MainWindow();
        if (!window) throw hresult_error(E_FAIL, L"The app has no window yet");
        winrt::Microsoft::Windows::Media::Capture::CameraCaptureUI capture(winrt::Microsoft::UI::GetWindowIdFromWindow(window));
        if (video) {
          capture.VideoSettings().Format(winrt::Microsoft::Windows::Media::Capture::CameraCaptureUIVideoFormat::Mp4);
        } else {
          capture.PhotoSettings().Format(winrt::Microsoft::Windows::Media::Capture::CameraCaptureUIPhotoFormat::Jpeg);
        }
        auto file = co_await capture.CaptureFileAsync(
            video ? winrt::Microsoft::Windows::Media::Capture::CameraCaptureUIMode::Video : winrt::Microsoft::Windows::Media::Capture::CameraCaptureUIMode::Photo);
        if (!file) {
          promise.Resolve(nullptr);
          co_return;
        }
        promise.Resolve(JSValueObject{{"uri", UriOf(fs::path(std::wstring(file.Path())))}});
      } catch (hresult_error const &error) {
        promise.Reject(Message(error).c_str());
      }
    });
#else
    static_cast<void>(video);
    promise.Reject("The camera capture UI needs Windows App SDK 1.7 or later");
#endif
  }

 private:
  ReactContext m_context;
};
