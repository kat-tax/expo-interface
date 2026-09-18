#include "pch.h"

#include "Common.h"
#include "ImageCache.h"

#include <NativeModules.h>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Foundation;
using namespace winrt::Windows::Graphics::Imaging;
using namespace winrt::Windows::Security::Cryptography;
using namespace winrt::Windows::Security::Cryptography::Core;
using namespace winrt::Windows::Storage;
using namespace winrt::Windows::Storage::Streams;
using namespace winrt::Windows::Web::Http;
using namespace ExpoWindows;

namespace fs = std::filesystem;

namespace ExpoWindows::ImageCache {

namespace {

constexpr uint32_t HEAD_BYTES = 4096;
constexpr size_t MEMORY_ENTRIES = 100;
constexpr wchar_t const *USER_AGENT = L"Mozilla/5.0 (Windows NT 10.0; Win64; x64) expo-windows (+https://github.com/kat-tax/expo-interface)";

std::string Sha256Hex(std::string const &text) {
  auto data = CryptographicBuffer::ConvertStringToBinary(to_hstring(text), BinaryStringEncoding::Utf8);
  auto hash = HashAlgorithmProvider::OpenAlgorithm(HashAlgorithmNames::Sha256()).HashData(data);
  return to_string(CryptographicBuffer::EncodeToHexString(hash));
}

bool StartsWith(std::string_view text, std::string_view prefix) noexcept {
  return text.size() >= prefix.size() && _strnicmp(text.data(), prefix.data(), prefix.size()) == 0;
}

/** The first bytes of a stream, read from its start. */
IAsyncOperation<IBuffer> HeadAsync(IRandomAccessStream stream) {
  auto input = stream.GetInputStreamAt(0);
  Buffer buffer(HEAD_BYTES);
  co_return co_await input.ReadAsync(buffer, HEAD_BYTES, InputStreamOptions::None);
}

std::vector<uint8_t> HeadOfFile(fs::path const &path) {
  std::vector<uint8_t> head(HEAD_BYTES);
  std::ifstream file(path, std::ios::binary);
  if (!file) return {};
  file.read(reinterpret_cast<char *>(head.data()), HEAD_BYTES);
  head.resize(static_cast<size_t>(file.gcount()));
  return head;
}

std::vector<uint8_t> ToVector(IBuffer const &buffer) {
  auto count = std::min<uint32_t>(buffer.Length(), HEAD_BYTES);
  return {buffer.data(), buffer.data() + count};
}

/** The bytes a `data:` URI carries, base64 or percent-encoded, and the media type it names. */
IBuffer DataUriBytes(std::string const &uri, std::string &mediaType) {
  auto comma = uri.find(',');
  if (comma == std::string::npos) throw hresult_invalid_argument(L"A data URI needs a comma");
  std::string meta = uri.substr(5, comma - 5);
  std::string data = uri.substr(comma + 1);
  bool base64 = meta.size() >= 7 && meta.compare(meta.size() - 7, 7, ";base64") == 0;
  if (base64) meta.resize(meta.size() - 7);
  mediaType = meta.substr(0, meta.find(';'));
  if (base64) return CryptographicBuffer::DecodeFromBase64String(to_hstring(data));
  std::string bytes;
  bytes.reserve(data.size());
  for (size_t i = 0; i < data.size(); ++i) {
    if (data[i] == '%' && i + 2 < data.size()) {
      bytes += static_cast<char>(std::stoi(data.substr(i + 1, 2), nullptr, 16));
      i += 2;
    } else {
      bytes += data[i];
    }
  }
  Buffer buffer(static_cast<uint32_t>(bytes.size()));
  memcpy(buffer.data(), bytes.data(), bytes.size());
  buffer.Length(static_cast<uint32_t>(bytes.size()));
  return buffer;
}

// -- The blurhash codec (https://github.com/woltapp/blurhash) -------------------

constexpr char BASE83[] = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~";

int Decode83(std::string_view text) {
  int value = 0;
  for (char c : text) {
    auto found = std::strchr(BASE83, c);
    if (!found || !c) return -1;
    value = value * 83 + static_cast<int>(found - BASE83);
  }
  return value;
}

std::string Encode83(int value, int length) {
  std::string out(static_cast<size_t>(length), '0');
  for (int i = length - 1; i >= 0; --i) {
    out[static_cast<size_t>(i)] = BASE83[value % 83];
    value /= 83;
  }
  return out;
}

float ToLinear(int value) {
  float v = static_cast<float>(value) / 255.0f;
  return v <= 0.04045f ? v / 12.92f : std::pow((v + 0.055f) / 1.055f, 2.4f);
}

int ToSrgb(float value) {
  float v = std::clamp(value, 0.0f, 1.0f);
  float out = v <= 0.0031308f ? v * 12.92f : 1.055f * std::pow(v, 1.0f / 2.4f) - 0.055f;
  return static_cast<int>(out * 255.0f + 0.5f);
}

float SignPow(float value, float exponent) {
  return std::copysign(std::pow(std::abs(value), exponent), value);
}

struct Rgb {
  float r{0}, g{0}, b{0};
};

} // namespace

fs::path Folder() {
  return CachePath(L"ExpoImage");
}

std::string KeyOf(std::string const &uri, std::string const &cacheKey) {
  return cacheKey.empty() ? uri : cacheKey;
}

fs::path FileFor(std::string const &key) {
  return Folder() / fs::path(ToWide(Sha256Hex(key)));
}

std::string MediaTypeOf(uint8_t const *bytes, size_t count) {
  if (count >= 4 && bytes[0] == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G') return "image/png";
  if (count >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF) return "image/jpeg";
  if (count >= 4 && std::memcmp(bytes, "GIF8", 4) == 0) return "image/gif";
  if (count >= 12 && std::memcmp(bytes, "RIFF", 4) == 0 && std::memcmp(bytes + 8, "WEBP", 4) == 0) return "image/webp";
  if (count >= 2 && bytes[0] == 'B' && bytes[1] == 'M') return "image/bmp";
  if (count >= 4 && (std::memcmp(bytes, "II*\0", 4) == 0 || std::memcmp(bytes, "MM\0*", 4) == 0)) return "image/tiff";
  if (count >= 12 && std::memcmp(bytes + 4, "ftyp", 4) == 0) return "image/heif";
  std::string_view text(reinterpret_cast<char const *>(bytes), count);
  if (text.find("<svg") != std::string_view::npos || (text.find("<?xml") != std::string_view::npos && text.find("svg") != std::string_view::npos)) return "image/svg+xml";
  return "";
}

std::pair<double, double> SvgSizeOf(std::vector<uint8_t> const &head) {
  std::string text(head.begin(), head.end());
  std::smatch match;
  static const std::regex viewBox(R"(viewBox\s*=\s*["']\s*[-+\d.eE]+[\s,]+[-+\d.eE]+[\s,]+([+\d.eE]+)[\s,]+([+\d.eE]+))");
  if (std::regex_search(text, match, viewBox)) return {std::atof(match[1].str().c_str()), std::atof(match[2].str().c_str())};
  static const std::regex width(R"(<svg[^>]*\swidth\s*=\s*["']([\d.]+))");
  static const std::regex height(R"(<svg[^>]*\sheight\s*=\s*["']([\d.]+))");
  double w = 0, h = 0;
  if (std::regex_search(text, match, width)) w = std::atof(match[1].str().c_str());
  if (std::regex_search(text, match, height)) h = std::atof(match[1].str().c_str());
  return {w, h};
}

IAsyncAction FetchAsync(std::shared_ptr<Fetch> fetch) {
  co_await resume_background();
  try {
    std::string const &uri = fetch->uri;
    if (StartsWith(uri, "data:")) {
      std::string named;
      auto bytes = DataUriBytes(uri, named);
      InMemoryRandomAccessStream stream;
      co_await stream.WriteAsync(bytes);
      co_await stream.FlushAsync();
      stream.Seek(0);
      fetch->stream = stream;
      fetch->head = ToVector(bytes);
      fetch->mediaType = MediaTypeOf(fetch->head.data(), fetch->head.size());
      if (fetch->mediaType.empty()) fetch->mediaType = named;
      co_return;
    }
    if (!StartsWith(uri, "http://") && !StartsWith(uri, "https://")) {
      std::wstring local = PathFromUri(uri);
      if (local.empty()) {
        fetch->error = "Windows loads images from http, https, file and data URIs; not " + uri;
        co_return;
      }
      std::error_code ignored;
      if (!fs::is_regular_file(local, ignored)) {
        fetch->error = "There is no image file at " + ToUtf8(local);
        co_return;
      }
      fetch->path = local;
      fetch->head = HeadOfFile(local);
      fetch->mediaType = MediaTypeOf(fetch->head.data(), fetch->head.size());
      co_return;
    }
    const bool disk = fetch->policy == "disk" || fetch->policy == "memory-disk";
    auto file = FileFor(KeyOf(uri, fetch->cacheKey));
    std::error_code ignored;
    if (disk && fs::is_regular_file(file, ignored)) {
      fetch->path = file.wstring();
      fetch->cacheType = "disk";
      fetch->head = HeadOfFile(file);
      fetch->mediaType = MediaTypeOf(fetch->head.data(), fetch->head.size());
      co_return;
    }
    HttpClient client;
    HttpRequestMessage request(HttpMethod::Get(), Uri(to_hstring(uri)));
    for (auto const &[name, value] : fetch->headers) request.Headers().TryAppendWithoutValidation(to_hstring(name), to_hstring(value));
    // A user agent, as browsers and the other platforms' loaders send one: some hosts refuse a request without.
    if (fetch->headers.find("User-Agent") == fetch->headers.end() && fetch->headers.find("user-agent") == fetch->headers.end()) {
      request.Headers().TryAppendWithoutValidation(L"User-Agent", USER_AGENT);
    }
    auto response = co_await client.SendRequestAsync(request, HttpCompletionOption::ResponseHeadersRead);
    if (!response.IsSuccessStatusCode()) {
      fetch->error = "The image request answered " + std::to_string(static_cast<int>(response.StatusCode()));
      co_return;
    }
    uint64_t total = response.Content().Headers().ContentLength() ? response.Content().Headers().ContentLength().Value() : 0;
    InMemoryRandomAccessStream memory;
    auto writing = response.Content().WriteToStreamAsync(memory);
    if (fetch->progress) {
      writing.Progress([fetch, total](auto const &, uint64_t written) { fetch->progress(written, total); });
    }
    co_await writing;
    co_await memory.FlushAsync();
    memory.Seek(0);
    fetch->head = ToVector(co_await HeadAsync(memory));
    fetch->mediaType = MediaTypeOf(fetch->head.data(), fetch->head.size());
    if (fetch->mediaType.empty() && response.Content().Headers().ContentType()) fetch->mediaType = to_string(response.Content().Headers().ContentType().MediaType());
    if (disk) {
      // Written beside the entry and moved over it once whole, so a view
      // and a prefetch of the same image at once never share a half file.
      fs::create_directories(file.parent_path(), ignored);
      auto part = file.parent_path() / fs::path(NewFileName(L".part"));
      auto target = co_await FileRandomAccessStream::OpenAsync(part.c_str(), FileAccessMode::ReadWrite, StorageOpenOptions::None, FileOpenDisposition::CreateAlways);
      co_await RandomAccessStream::CopyAsync(memory.GetInputStreamAt(0), target.GetOutputStreamAt(0));
      co_await target.FlushAsync();
      target.Close();
      fs::rename(part, file, ignored);
      if (ignored) {
        fs::remove(part, ignored);
        if (!fs::is_regular_file(file, ignored)) {
          fetch->stream = memory;
          co_return;
        }
      }
      fetch->path = file.wstring();
    } else {
      fetch->stream = memory;
    }
  } catch (hresult_error const &error) {
    fetch->error = Message(error);
  } catch (std::exception const &error) {
    fetch->error = error.what();
  }
}

bool ClearDisk() {
  bool all = true;
  std::error_code error;
  for (auto const &entry : fs::directory_iterator(Folder(), error)) {
    if (!fs::remove(entry.path(), error)) all = false;
  }
  return all && !error;
}

namespace {
/** Leaked on purpose: a XAML object destroyed after the apartment is gone would fault at exit. */
std::map<std::string, Cached> &Memory() {
  static auto *entries = new std::map<std::string, Cached>();
  return *entries;
}
} // namespace

Cached FromMemory(std::string const &key) {
  auto &entries = Memory();
  auto found = entries.find(key);
  return found == entries.end() ? Cached{} : found->second;
}

void ToMemory(std::string const &key, Cached const &entry) {
  auto &entries = Memory();
  if (entries.size() >= MEMORY_ENTRIES) entries.clear();
  entries[key] = entry;
}

void ClearMemory() {
  Memory().clear();
}

bool DecodeBlurhash(std::string const &hash, int width, int height, std::vector<uint8_t> &bgra, float punch) {
  if (hash.size() < 6 || width <= 0 || height <= 0) return false;
  int sizeFlag = Decode83(hash.substr(0, 1));
  if (sizeFlag < 0) return false;
  int numY = sizeFlag / 9 + 1;
  int numX = sizeFlag % 9 + 1;
  if (hash.size() != static_cast<size_t>(4 + 2 * numX * numY)) return false;
  int quantised = Decode83(hash.substr(1, 1));
  if (quantised < 0) return false;
  float maximum = static_cast<float>(quantised + 1) / 166.0f;
  std::vector<Rgb> colors(static_cast<size_t>(numX * numY));
  for (int i = 0; i < numX * numY; ++i) {
    if (i == 0) {
      int value = Decode83(hash.substr(2, 4));
      if (value < 0) return false;
      colors[0] = {ToLinear(value >> 16), ToLinear((value >> 8) & 255), ToLinear(value & 255)};
    } else {
      int value = Decode83(hash.substr(static_cast<size_t>(4 + i * 2), 2));
      if (value < 0) return false;
      int quantR = value / (19 * 19);
      int quantG = (value / 19) % 19;
      int quantB = value % 19;
      colors[static_cast<size_t>(i)] = {
          SignPow((quantR - 9) / 9.0f, 2.0f) * maximum * punch,
          SignPow((quantG - 9) / 9.0f, 2.0f) * maximum * punch,
          SignPow((quantB - 9) / 9.0f, 2.0f) * maximum * punch,
      };
    }
  }
  bgra.assign(static_cast<size_t>(width) * height * 4, 0);
  constexpr float PI = 3.14159265358979f;
  for (int y = 0; y < height; ++y) {
    for (int x = 0; x < width; ++x) {
      Rgb sum;
      for (int j = 0; j < numY; ++j) {
        for (int i = 0; i < numX; ++i) {
          float basis = std::cos(PI * x * i / width) * std::cos(PI * y * j / height);
          auto const &color = colors[static_cast<size_t>(i + j * numX)];
          sum.r += color.r * basis;
          sum.g += color.g * basis;
          sum.b += color.b * basis;
        }
      }
      auto *pixel = &bgra[(static_cast<size_t>(y) * width + x) * 4];
      pixel[0] = static_cast<uint8_t>(ToSrgb(sum.b));
      pixel[1] = static_cast<uint8_t>(ToSrgb(sum.g));
      pixel[2] = static_cast<uint8_t>(ToSrgb(sum.r));
      pixel[3] = 255;
    }
  }
  return true;
}

std::string EncodeBlurhash(uint8_t const *bgra, int width, int height, int componentsX, int componentsY) {
  componentsX = std::clamp(componentsX, 1, 9);
  componentsY = std::clamp(componentsY, 1, 9);
  if (width <= 0 || height <= 0) return "";
  constexpr float PI = 3.14159265358979f;
  std::vector<Rgb> factors;
  for (int j = 0; j < componentsY; ++j) {
    for (int i = 0; i < componentsX; ++i) {
      float normalisation = (i == 0 && j == 0) ? 1.0f : 2.0f;
      Rgb factor;
      for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
          float basis = normalisation * std::cos(PI * i * x / width) * std::cos(PI * j * y / height);
          auto const *pixel = &bgra[(static_cast<size_t>(y) * width + x) * 4];
          factor.r += basis * ToLinear(pixel[2]);
          factor.g += basis * ToLinear(pixel[1]);
          factor.b += basis * ToLinear(pixel[0]);
        }
      }
      float scale = 1.0f / static_cast<float>(width * height);
      factors.push_back({factor.r * scale, factor.g * scale, factor.b * scale});
    }
  }
  std::string hash = Encode83((componentsX - 1) + (componentsY - 1) * 9, 1);
  float maximum = 1.0f;
  if (factors.size() > 1) {
    float actual = 0;
    for (size_t i = 1; i < factors.size(); ++i) actual = std::max({actual, std::abs(factors[i].r), std::abs(factors[i].g), std::abs(factors[i].b)});
    int quantised = std::clamp(static_cast<int>(std::floor(actual * 166.0f - 0.5f)), 0, 82);
    maximum = static_cast<float>(quantised + 1) / 166.0f;
    hash += Encode83(quantised, 1);
  } else {
    hash += Encode83(0, 1);
  }
  auto const &dc = factors[0];
  hash += Encode83((ToSrgb(dc.r) << 16) + (ToSrgb(dc.g) << 8) + ToSrgb(dc.b), 4);
  for (size_t i = 1; i < factors.size(); ++i) {
    auto quantise = [maximum](float value) { return std::clamp(static_cast<int>(std::floor(SignPow(value / maximum, 0.5f) * 9.0f + 9.5f)), 0, 18); };
    hash += Encode83(quantise(factors[i].r) * 19 * 19 + quantise(factors[i].g) * 19 + quantise(factors[i].b), 2);
  }
  return hash;
}

} // namespace ExpoWindows::ImageCache

namespace {

using namespace ExpoWindows::ImageCache;

/** The bytes of a fetch as a stream to decode: the file opened, or the memory it came into. */
IAsyncOperation<IRandomAccessStream> StreamOf(std::shared_ptr<Fetch> fetch) {
  if (!fetch->path.empty()) co_return co_await FileRandomAccessStream::OpenAsync(fetch->path.c_str(), FileAccessMode::Read);
  co_return fetch->stream;
}

std::map<std::string, std::string> HeadersOf(JSValue const &headers) {
  std::map<std::string, std::string> out;
  if (headers.Type() == JSValueType::Object) {
    for (auto const &[name, value] : headers.AsObject()) out[name] = value.AsString();
  }
  return out;
}

} // namespace

/**
 * `ExpoWindowsImageLoader`: what `expo-image` asks of the runtime beside
 * its view — `prefetch` into the disk cache, the caches cleared, the
 * cached path for a key, a local file written under a key, an image
 * loaded for its size (`useImage`, `loadAsync`), and a blurhash made from
 * one.
 */
REACT_MODULE(ExpoWindowsImageLoader)
struct ExpoWindowsImageLoader {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
  }

  /** Fetches every URL; false as soon as one cannot be. A policy without the disk keeps nothing here. */
  REACT_METHOD(Prefetch, L"prefetch")
  fire_and_forget Prefetch(JSValue urls, std::string cachePolicy, JSValue headers, ReactPromise<bool> promise) noexcept {
    std::vector<std::string> list;
    if (urls.Type() == JSValueType::Array) {
      for (auto const &url : urls.AsArray()) list.push_back(url.AsString());
    }
    auto shared = HeadersOf(headers);
    for (auto const &url : list) {
      auto fetch = std::make_shared<Fetch>();
      fetch->uri = url;
      fetch->headers = shared;
      fetch->policy = cachePolicy;
      co_await FetchAsync(fetch);
      if (!fetch->error.empty()) {
        promise.Resolve(false);
        co_return;
      }
    }
    promise.Resolve(true);
  }

  REACT_METHOD(ClearDiskCache, L"clearDiskCache")
  fire_and_forget ClearDiskCache(ReactPromise<bool> promise) noexcept {
    co_await resume_background();
    promise.Resolve(ClearDisk());
  }

  REACT_METHOD(ClearMemoryCache, L"clearMemoryCache")
  void ClearMemoryCache(ReactPromise<bool> promise) noexcept {
    m_context.UIDispatcher().Post([promise]() {
      ClearMemory();
      promise.Resolve(true);
    });
  }

  /** The cached file's path for a key, or null. */
  REACT_METHOD(GetCachePath, L"getCachePath")
  fire_and_forget GetCachePath(std::string cacheKey, ReactPromise<JSValue> promise) noexcept {
    co_await resume_background();
    try {
      auto file = FileFor(cacheKey);
      std::error_code ignored;
      if (fs::is_regular_file(file, ignored)) promise.Resolve(JSValue{ToUtf8(file.wstring())});
      else promise.Resolve(JSValue{nullptr});
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  /** Copies a local image into the cache under the key. */
  REACT_METHOD(WriteToCache, L"writeToCache")
  fire_and_forget WriteToCache(std::string uri, std::string cacheKey, ReactPromise<void> promise) noexcept {
    co_await resume_background();
    try {
      std::wstring source = PathFromUri(uri);
      if (source.empty()) throw hresult_invalid_argument(L"writeToCacheAsync takes a local file");
      auto file = FileFor(cacheKey);
      std::error_code ignored;
      fs::create_directories(file.parent_path(), ignored);
      fs::copy_file(source, file, fs::copy_options::overwrite_existing);
      promise.Resolve();
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    } catch (std::exception const &error) {
      promise.Reject(error.what());
    }
  }

  /** Fetches the image (into the disk cache for a URL) and answers with where it is and what it is. */
  REACT_METHOD(Load, L"load")
  fire_and_forget Load(std::string uri, JSValue headers, std::string cacheKey, ReactPromise<JSValue> promise) noexcept {
    try {
      auto fetch = std::make_shared<Fetch>();
      fetch->uri = uri;
      fetch->headers = HeadersOf(headers);
      fetch->cacheKey = cacheKey;
      co_await FetchAsync(fetch);
      if (!fetch->error.empty()) throw hresult_error(E_FAIL, ToWide(fetch->error).c_str());
      JSValueObject result{{"uri", fetch->path.empty() ? uri : FileUri(fetch->path)}, {"cacheType", fetch->cacheType}, {"mediaType", fetch->mediaType}, {"isAnimated", false}};
      if (fetch->mediaType == "image/svg+xml") {
        auto [width, height] = SvgSizeOf(fetch->head);
        result["width"] = width;
        result["height"] = height;
      } else {
        auto stream = co_await StreamOf(fetch);
        auto decoder = co_await BitmapDecoder::CreateAsync(stream);
        result["width"] = static_cast<int>(decoder.OrientedPixelWidth());
        result["height"] = static_cast<int>(decoder.OrientedPixelHeight());
        result["isAnimated"] = decoder.FrameCount() > 1;
        auto types = decoder.DecoderInformation().MimeTypes();
        if (types.Size() > 0) result["mediaType"] = to_string(types.GetAt(0));
        stream.Close();
      }
      promise.Resolve(std::move(result));
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  /** The image scaled to at most 64 pixels a side, encoded as a blurhash of the components asked. */
  REACT_METHOD(GenerateBlurhash, L"generateBlurhash")
  fire_and_forget GenerateBlurhash(std::string uri, int componentsX, int componentsY, ReactPromise<std::string> promise) noexcept {
    try {
      auto fetch = std::make_shared<Fetch>();
      fetch->uri = uri;
      co_await FetchAsync(fetch);
      if (!fetch->error.empty()) throw hresult_error(E_FAIL, ToWide(fetch->error).c_str());
      if (fetch->mediaType == "image/svg+xml") throw hresult_error(E_FAIL, L"A blurhash is made from a bitmap, not an SVG");
      auto stream = co_await StreamOf(fetch);
      auto decoder = co_await BitmapDecoder::CreateAsync(stream);
      BitmapTransform transform;
      uint32_t width = decoder.OrientedPixelWidth();
      uint32_t height = decoder.OrientedPixelHeight();
      double scale = std::min(1.0, 64.0 / std::max<uint32_t>(1, std::max(width, height)));
      transform.ScaledWidth(std::max<uint32_t>(1, static_cast<uint32_t>(std::lround(width * scale))));
      transform.ScaledHeight(std::max<uint32_t>(1, static_cast<uint32_t>(std::lround(height * scale))));
      transform.InterpolationMode(BitmapInterpolationMode::Fant);
      auto bitmap = co_await decoder.GetSoftwareBitmapAsync(
          BitmapPixelFormat::Bgra8, BitmapAlphaMode::Premultiplied, transform, ExifOrientationMode::RespectExifOrientation, ColorManagementMode::DoNotColorManage);
      stream.Close();
      uint32_t size = static_cast<uint32_t>(bitmap.PixelWidth()) * static_cast<uint32_t>(bitmap.PixelHeight()) * 4;
      Buffer buffer(size);
      buffer.Length(size);
      bitmap.CopyToBuffer(buffer);
      promise.Resolve(EncodeBlurhash(buffer.data(), bitmap.PixelWidth(), bitmap.PixelHeight(), componentsX, componentsY));
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

 private:
  ReactContext m_context;
};
