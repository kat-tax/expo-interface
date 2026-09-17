#include "pch.h"

#include <NativeModules.h>

#include "Common.h"

using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::ApplicationModel::DataTransfer;
using namespace winrt::Windows::Foundation;
using namespace winrt::Windows::Graphics::Imaging;
using namespace winrt::Windows::Security::Cryptography;
using namespace winrt::Windows::Storage::Streams;

namespace ExpoWindows {

namespace {

/** What the clipboard holds, in `expo-clipboard`'s content type names. */
JSValueArray ContentTypes() noexcept {
  JSValueArray types;
  try {
    auto content = Clipboard::GetContent();
    if (content.Contains(StandardDataFormats::Text())) types.push_back("plain-text");
    if (content.Contains(StandardDataFormats::Html())) types.push_back("html");
    if (content.Contains(StandardDataFormats::Bitmap())) types.push_back("image");
    if (content.Contains(StandardDataFormats::WebLink()) || content.Contains(StandardDataFormats::ApplicationLink())) {
      types.push_back("url");
    }
  } catch (...) {
  }
  return types;
}

winrt::fire_and_forget GetStringAsync(std::string preferredFormat, ReactPromise<std::string> promise) noexcept {
  try {
    auto content = Clipboard::GetContent();
    if (preferredFormat == "html" && content.Contains(StandardDataFormats::Html())) {
      promise.Resolve(ToUtf8(co_await content.GetHtmlFormatAsync()));
    } else if (content.Contains(StandardDataFormats::Text())) {
      promise.Resolve(ToUtf8(co_await content.GetTextAsync()));
    } else {
      promise.Resolve("");
    }
  } catch (winrt::hresult_error const &error) {
    promise.Reject(Message(error).c_str());
  }
}

winrt::fire_and_forget GetUrlAsync(ReactPromise<std::string> promise) noexcept {
  try {
    auto content = Clipboard::GetContent();
    if (content.Contains(StandardDataFormats::WebLink())) {
      promise.Resolve(ToUtf8((co_await content.GetWebLinkAsync()).AbsoluteUri()));
    } else if (content.Contains(StandardDataFormats::ApplicationLink())) {
      promise.Resolve(ToUtf8((co_await content.GetApplicationLinkAsync()).AbsoluteUri()));
    } else {
      promise.Resolve("");
    }
  } catch (winrt::hresult_error const &error) {
    promise.Reject(Message(error).c_str());
  }
}

/** The clipboard's image as a PNG data URL with its size, as `expo-clipboard` returns one. */
winrt::fire_and_forget GetImageAsync(ReactPromise<JSValue> promise) noexcept {
  try {
    auto content = Clipboard::GetContent();
    if (!content.Contains(StandardDataFormats::Bitmap())) {
      promise.Resolve(JSValue{nullptr});
      co_return;
    }
    auto reference = co_await content.GetBitmapAsync();
    auto source = co_await reference.OpenReadAsync();
    auto decoder = co_await BitmapDecoder::CreateAsync(source);
    auto bitmap = co_await decoder.GetSoftwareBitmapAsync();
    InMemoryRandomAccessStream encoded;
    auto encoder = co_await BitmapEncoder::CreateAsync(BitmapEncoder::PngEncoderId(), encoded);
    encoder.SetSoftwareBitmap(bitmap);
    co_await encoder.FlushAsync();
    Buffer buffer{static_cast<uint32_t>(encoded.Size())};
    encoded.Seek(0);
    co_await encoded.ReadAsync(buffer, buffer.Capacity(), InputStreamOptions::None);
    promise.Resolve(JSValueObject{
        {"data", "data:image/png;base64," + ToUtf8(CryptographicBuffer::EncodeToBase64String(buffer))},
        {"size", JSValueObject{{"width", static_cast<double>(bitmap.PixelWidth())}, {"height", static_cast<double>(bitmap.PixelHeight())}}},
    });
  } catch (winrt::hresult_error const &error) {
    promise.Reject(Message(error).c_str());
  }
}

winrt::fire_and_forget SetImageAsync(std::string base64, ReactPromise<void> promise) noexcept {
  try {
    const auto comma = base64.find(',');
    const auto bytes = CryptographicBuffer::DecodeFromBase64String(ToWide(comma == std::string::npos ? base64 : base64.substr(comma + 1)));
    InMemoryRandomAccessStream stream;
    co_await stream.WriteAsync(bytes);
    co_await stream.FlushAsync();
    stream.Seek(0);
    DataPackage data;
    data.SetBitmap(RandomAccessStreamReference::CreateFromStream(stream));
    Clipboard::SetContent(data);
    Clipboard::Flush();
    promise.Resolve();
  } catch (winrt::hresult_error const &error) {
    promise.Reject(Message(error).c_str());
  }
}

} // namespace

/**
 * `ExpoWindowsClipboard`: what `expo-clipboard` reads and writes through on
 * Windows — text (plain or HTML), links and images over the platform's
 * clipboard, on the UI thread it wants, and its `ContentChanged` as the
 * package's `onClipboardChanged` event with the content types on offer.
 */
REACT_MODULE(ExpoWindowsClipboard)
struct ExpoWindowsClipboard {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
    // ContentChanged is a static event, subscribed on the UI thread the clipboard wants;
    // the subscription follows this module and is dropped with it.
    context.UIDispatcher().Post([this] {
      try {
        m_changed = Clipboard::ContentChanged(winrt::auto_revoke, [this](auto const &, auto const &) {
          auto emit = OnClipboardChanged;
          m_context.UIDispatcher().Post([emit] { emit(JSValueObject{{"contentTypes", ContentTypes()}}); });
        });
      } catch (...) {
        // No change events, then; reading and writing still work.
      }
    });
  }

  REACT_EVENT(OnClipboardChanged, L"onClipboardChanged")
  std::function<void(JSValue)> OnClipboardChanged;

  REACT_METHOD(GetString, L"getString")
  void GetString(std::string preferredFormat, ReactPromise<std::string> promise) noexcept {
    m_context.UIDispatcher().Post([preferredFormat, promise] { GetStringAsync(preferredFormat, promise); });
  }

  REACT_METHOD(SetString, L"setString")
  void SetString(std::string text, std::string inputFormat, ReactPromise<bool> promise) noexcept {
    m_context.UIDispatcher().Post([text = ToWide(text), inputFormat, promise] {
      try {
        DataPackage data;
        if (inputFormat == "html") data.SetHtmlFormat(HtmlFormatHelper::CreateHtmlFormat(text));
        data.SetText(text);
        Clipboard::SetContent(data);
        Clipboard::Flush();
        promise.Resolve(true);
      } catch (winrt::hresult_error const &error) {
        promise.Reject(Message(error).c_str());
      }
    });
  }

  REACT_METHOD(HasString, L"hasString")
  void HasString(ReactPromise<bool> promise) noexcept {
    Has(StandardDataFormats::Text(), promise);
  }

  REACT_METHOD(GetUrl, L"getUrl")
  void GetUrl(ReactPromise<std::string> promise) noexcept {
    m_context.UIDispatcher().Post([promise] { GetUrlAsync(promise); });
  }

  REACT_METHOD(SetUrl, L"setUrl")
  void SetUrl(std::string url, ReactPromise<void> promise) noexcept {
    m_context.UIDispatcher().Post([url = ToWide(url), promise] {
      try {
        DataPackage data;
        data.SetWebLink(Uri{url});
        data.SetText(url);
        Clipboard::SetContent(data);
        Clipboard::Flush();
        promise.Resolve();
      } catch (winrt::hresult_error const &error) {
        promise.Reject(Message(error).c_str());
      }
    });
  }

  REACT_METHOD(HasUrl, L"hasUrl")
  void HasUrl(ReactPromise<bool> promise) noexcept {
    m_context.UIDispatcher().Post([promise] {
      try {
        auto content = Clipboard::GetContent();
        promise.Resolve(content.Contains(StandardDataFormats::WebLink()) || content.Contains(StandardDataFormats::ApplicationLink()));
      } catch (winrt::hresult_error const &error) {
        promise.Reject(Message(error).c_str());
      }
    });
  }

  REACT_METHOD(GetImage, L"getImage")
  void GetImage(ReactPromise<JSValue> promise) noexcept {
    m_context.UIDispatcher().Post([promise] { GetImageAsync(promise); });
  }

  REACT_METHOD(SetImage, L"setImage")
  void SetImage(std::string base64, ReactPromise<void> promise) noexcept {
    m_context.UIDispatcher().Post([base64, promise] { SetImageAsync(base64, promise); });
  }

  REACT_METHOD(HasImage, L"hasImage")
  void HasImage(ReactPromise<bool> promise) noexcept {
    Has(StandardDataFormats::Bitmap(), promise);
  }

 private:
  void Has(winrt::hstring format, ReactPromise<bool> promise) noexcept {
    m_context.UIDispatcher().Post([format, promise] {
      try {
        promise.Resolve(Clipboard::GetContent().Contains(format));
      } catch (winrt::hresult_error const &error) {
        promise.Reject(Message(error).c_str());
      }
    });
  }

  ReactContext m_context;
  Clipboard::ContentChanged_revoker m_changed;
};

} // namespace ExpoWindows
