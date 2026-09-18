#include "pch.h"

#ifdef RNW_NEW_ARCH

#include "Common.h"
#include "ImageCache.h"
#include "Islands.h"
#include "codegen/react/components/ExpoWindowsSpec/ExpoWindowsImageView.g.h"

#include <NativeModules.h>

namespace winrt::ExpoWindows {

using namespace winrt::Windows::Data::Json;
using namespace winrt::Windows::Graphics::Imaging;
using namespace winrt::Windows::Storage;
using namespace winrt::Windows::Storage::Streams;
using namespace winrt::Microsoft::UI::Xaml::Media::Imaging;
namespace animation = winrt::Microsoft::UI::Xaml::Media::Animation;
namespace cache = ::ExpoWindows::ImageCache;
using ::ExpoWindows::ToUtf8;
using ::ExpoWindows::ToWide;

namespace {

/** One of the sources the props list. */
struct Source {
  std::string uri;
  std::map<std::string, std::string> headers;
  std::string cacheKey;
  double width{0};
  double height{0};
};

/** One edge of the content position: set or not, a percentage or pixels. */
struct Edge {
  bool set{false};
  bool percent{false};
  double value{0};
};

struct Position {
  Edge top, left, right, bottom;
};

struct Transition {
  int duration{0};
  std::string timing{"ease-in-out"};
};

struct Natural {
  double width{0};
  double height{0};
};

struct Placement {
  double x{0}, y{0}, width{0}, height{0};
};

bool StartsWith(std::string_view text, std::string_view prefix) noexcept {
  return text.size() >= prefix.size() && text.compare(0, prefix.size(), prefix) == 0;
}

double NumberOf(JsonObject const &object, wchar_t const *name) {
  return object.HasKey(name) && object.GetNamedValue(name).ValueType() == JsonValueType::Number ? object.GetNamedNumber(name) : 0;
}

/** The first source a JSON list (or one object) names; none for none. */
std::optional<Source> FirstSource(std::optional<std::string> const &json) {
  if (!json || json->empty()) return std::nullopt;
  try {
    auto value = JsonValue::Parse(ToWide(*json));
    JsonObject object{nullptr};
    if (value.ValueType() == JsonValueType::Array) {
      auto list = value.GetArray();
      if (list.Size() == 0 || list.GetAt(0).ValueType() != JsonValueType::Object) return std::nullopt;
      object = list.GetObjectAt(0);
    } else if (value.ValueType() == JsonValueType::Object) {
      object = value.GetObject();
    } else {
      return std::nullopt;
    }
    Source source;
    source.uri = ToUtf8(object.GetNamedString(L"uri", L""));
    if (source.uri.empty()) return std::nullopt;
    source.cacheKey = ToUtf8(object.GetNamedString(L"cacheKey", L""));
    source.width = NumberOf(object, L"width");
    source.height = NumberOf(object, L"height");
    if (object.HasKey(L"headers") && object.GetNamedValue(L"headers").ValueType() == JsonValueType::Object) {
      for (auto const &pair : object.GetNamedObject(L"headers")) {
        if (pair.Value().ValueType() == JsonValueType::String) source.headers[ToUtf8(pair.Key())] = ToUtf8(pair.Value().GetString());
      }
    }
    return source;
  } catch (hresult_error const &) {
    return std::nullopt;
  }
}

Position Centered() {
  Position position;
  position.top = {true, true, 50};
  position.left = {true, true, 50};
  return position;
}

/** The content position `{top, left, right, bottom}`, each pixels or a percentage; the centre when it says nothing. */
Position ParsePosition(std::optional<std::string> const &json) {
  if (!json || json->empty()) return Centered();
  try {
    auto object = JsonObject::Parse(ToWide(*json));
    Position position;
    for (auto const &pair : object) {
      Edge edge;
      auto value = pair.Value();
      if (value.ValueType() == JsonValueType::Number) {
        edge = {true, false, value.GetNumber()};
      } else if (value.ValueType() == JsonValueType::String) {
        std::string text = ToUtf8(value.GetString());
        bool percent = !text.empty() && text.back() == '%';
        edge = {true, percent, std::atof(text.c_str())};
      } else {
        continue;
      }
      auto key = pair.Key();
      if (key == L"top") position.top = edge;
      else if (key == L"left") position.left = edge;
      else if (key == L"right") position.right = edge;
      else if (key == L"bottom") position.bottom = edge;
    }
    if (!position.top.set && !position.bottom.set) position.top = {true, true, 50};
    if (!position.left.set && !position.right.set) position.left = {true, true, 50};
    return position;
  } catch (hresult_error const &) {
    return Centered();
  }
}

Transition ParseTransition(std::optional<std::string> const &json) {
  Transition transition;
  if (!json || json->empty()) return transition;
  try {
    auto object = JsonObject::Parse(ToWide(*json));
    transition.duration = static_cast<int>(std::lround(NumberOf(object, L"duration")));
    if (object.HasKey(L"timing") && object.GetNamedValue(L"timing").ValueType() == JsonValueType::String) transition.timing = ToUtf8(object.GetNamedString(L"timing"));
  } catch (hresult_error const &) {
  }
  return transition;
}

/** Where along one axis the drawn size sits in the view, by the edge that says. */
double Along(Edge const &start, Edge const &end, double view, double drawn) {
  if (start.set) return start.percent ? (view - drawn) * start.value / 100 : start.value;
  return view - drawn - (end.percent ? (view - drawn) * end.value / 100 : end.value);
}

/** The size the picture draws at and where, for a fit and a position. */
Placement Place(Natural const &natural, double viewWidth, double viewHeight, std::string const &fit, Position const &position) {
  double width = viewWidth, height = viewHeight;
  if (natural.width > 0 && natural.height > 0 && fit != "fill") {
    double contain = std::min(viewWidth / natural.width, viewHeight / natural.height);
    double scale = 1;
    if (fit == "contain") scale = contain;
    else if (fit == "scale-down") scale = std::min(1.0, contain);
    else if (fit == "none") scale = 1;
    else scale = std::max(viewWidth / natural.width, viewHeight / natural.height);
    width = natural.width * scale;
    height = natural.height * scale;
  }
  return {Along(position.left, position.right, viewWidth, width), Along(position.top, position.bottom, viewHeight, height), width, height};
}

/** `#rrggbb` or `#rrggbbaa` as bytes; false for anything else. */
bool ParseColor(std::string const &text, uint8_t (&rgba)[4]) {
  if ((text.size() != 7 && text.size() != 9) || text[0] != '#') return false;
  for (size_t i = 0; i < 4; ++i) {
    if (i == 3 && text.size() == 7) {
      rgba[3] = 255;
      break;
    }
    char const pair[3] = {text[1 + i * 2], text[2 + i * 2], 0};
    char *end = nullptr;
    long value = std::strtol(pair, &end, 16);
    if (end != pair + 2) return false;
    rgba[i] = static_cast<uint8_t>(value);
  }
  return true;
}

/** Paints the colour wherever the picture has alpha: the picture as a mask, as iOS's template images. */
void Tint(uint8_t *bgra, size_t pixels, uint8_t const (&rgba)[4]) {
  for (size_t i = 0; i < pixels; ++i) {
    auto *pixel = bgra + i * 4;
    unsigned alpha = pixel[3] * rgba[3] / 255;
    pixel[0] = static_cast<uint8_t>(rgba[2] * alpha / 255);
    pixel[1] = static_cast<uint8_t>(rgba[1] * alpha / 255);
    pixel[2] = static_cast<uint8_t>(rgba[0] * alpha / 255);
    pixel[3] = static_cast<uint8_t>(alpha);
  }
}

void BlurLine(uint8_t const *in, uint8_t *out, int count, int stride, int radius) {
  const int window = radius * 2 + 1;
  int sum[4] = {0, 0, 0, 0};
  for (int i = -radius; i <= radius; ++i) {
    int index = std::clamp(i, 0, count - 1);
    for (int c = 0; c < 4; ++c) sum[c] += in[index * stride + c];
  }
  for (int x = 0; x < count; ++x) {
    for (int c = 0; c < 4; ++c) out[x * stride + c] = static_cast<uint8_t>(sum[c] / window);
    int leaving = std::clamp(x - radius, 0, count - 1);
    int entering = std::clamp(x + radius + 1, 0, count - 1);
    for (int c = 0; c < 4; ++c) sum[c] += in[entering * stride + c] - in[leaving * stride + c];
  }
}

/** Three box blurs each way: near enough a Gaussian of the radius. */
void Blur(uint8_t *bgra, int width, int height, int radius) {
  radius = std::clamp(radius, 1, 64);
  std::vector<uint8_t> temp(static_cast<size_t>(width) * height * 4);
  for (int pass = 0; pass < 3; ++pass) {
    for (int y = 0; y < height; ++y) BlurLine(bgra + static_cast<size_t>(y) * width * 4, temp.data() + static_cast<size_t>(y) * width * 4, width, 4, radius);
    for (int x = 0; x < width; ++x) BlurLine(temp.data() + static_cast<size_t>(x) * 4, bgra + static_cast<size_t>(x) * 4, height, width * 4, radius);
  }
}

std::string PercentDecoded(std::string const &text) {
  std::string out;
  for (size_t i = 0; i < text.size(); ++i) {
    if (text[i] == '%' && i + 2 < text.size()) {
      out += static_cast<char>(std::strtol(text.substr(i + 1, 2).c_str(), nullptr, 16));
      i += 2;
    } else {
      out += text[i];
    }
  }
  return out;
}

/** A `blurhash:/<hash>` source decoded at the size it names (16 when it names none) into a bitmap; no source when it is not a blurhash. */
cache::Cached DecodeBlurhash(Source const &source) {
  cache::Cached out;
  std::string hash = PercentDecoded(source.uri.substr(std::string("blurhash:/").size()));
  int width = std::clamp(static_cast<int>(std::lround(source.width > 0 ? source.width : 16)), 1, 128);
  int height = std::clamp(static_cast<int>(std::lround(source.height > 0 ? source.height : 16)), 1, 128);
  std::vector<uint8_t> pixels;
  if (!cache::DecodeBlurhash(hash, width, height, pixels)) return out;
  WriteableBitmap bitmap(width, height);
  auto buffer = bitmap.PixelBuffer();
  memcpy(buffer.data(), pixels.data(), std::min<size_t>(pixels.size(), buffer.Capacity()));
  bitmap.Invalidate();
  out.source = bitmap;
  out.width = width;
  out.height = height;
  out.mediaType = "image/blurhash";
  return out;
}

/** The bytes of a fetch as a stream to decode: the file opened, or the memory they came into. */
winrt::Windows::Foundation::IAsyncOperation<IRandomAccessStream> StreamOf(std::shared_ptr<cache::Fetch> fetch) {
  if (!fetch->path.empty()) co_return co_await FileRandomAccessStream::OpenAsync(fetch->path.c_str(), FileAccessMode::Read);
  co_return fetch->stream;
}

/**
 * Decodes what a fetch brought into a XAML image source: an SVG through
 * `SvgImageSource`, a tinted or blurred picture through its pixels into a
 * `SoftwareBitmapSource`, anything else through `BitmapImage`, which plays
 * an animated GIF. Runs on the UI thread; throws when the codecs cannot.
 */
winrt::Windows::Foundation::IAsyncAction Decode(std::shared_ptr<cache::Fetch> fetch, std::shared_ptr<cache::Cached> out, std::string tint, int blur, bool autoplay) {
  auto stream = co_await StreamOf(fetch);
  out->mediaType = fetch->mediaType;
  if (fetch->mediaType == "image/svg+xml") {
    auto [width, height] = cache::SvgSizeOf(fetch->head);
    SvgImageSource svg;
    auto status = co_await svg.SetSourceAsync(stream);
    if (status != SvgImageSourceLoadStatus::Success) throw hresult_error(E_FAIL, L"The SVG could not be loaded");
    out->source = svg;
    out->width = static_cast<int32_t>(std::lround(width));
    out->height = static_cast<int32_t>(std::lround(height));
    co_return;
  }
  uint8_t rgba[4]{};
  const bool tinted = ParseColor(tint, rgba);
  if (tinted || blur > 0) {
    auto decoder = co_await BitmapDecoder::CreateAsync(stream);
    auto bitmap = co_await decoder.GetSoftwareBitmapAsync(
        BitmapPixelFormat::Bgra8, BitmapAlphaMode::Premultiplied, BitmapTransform{}, ExifOrientationMode::RespectExifOrientation, ColorManagementMode::DoNotColorManage);
    const uint32_t width = static_cast<uint32_t>(bitmap.PixelWidth());
    const uint32_t height = static_cast<uint32_t>(bitmap.PixelHeight());
    const uint32_t size = width * height * 4;
    Buffer buffer(size);
    buffer.Length(size);
    bitmap.CopyToBuffer(buffer);
    if (tinted) Tint(buffer.data(), static_cast<size_t>(width) * height, rgba);
    if (blur > 0) Blur(buffer.data(), static_cast<int>(width), static_cast<int>(height), blur);
    bitmap.CopyFromBuffer(buffer);
    SoftwareBitmapSource source;
    co_await source.SetBitmapAsync(bitmap);
    out->source = source;
    out->width = static_cast<int32_t>(width);
    out->height = static_cast<int32_t>(height);
    auto types = decoder.DecoderInformation().MimeTypes();
    if (types.Size() > 0) out->mediaType = to_string(types.GetAt(0));
    co_return;
  }
  BitmapImage bitmap;
  bitmap.AutoPlay(autoplay);
  co_await bitmap.SetSourceAsync(stream);
  out->source = bitmap;
  out->width = bitmap.PixelWidth();
  out->height = bitmap.PixelHeight();
  out->animated = bitmap.IsAnimatedBitmap();
}

} // namespace

/**
 * `ExpoWindowsImageView`: WinUI 3 `Image`s on a canvas in an island — the
 * view behind `expo-image` on Windows. The first source is fetched (the
 * disk cache under the app's cache folder, the memory cache of decoded
 * pictures), decoded by the system's codecs (SVG through `SvgImageSource`,
 * a blurhash by the runtime), drawn at the size and place `contentFit` and
 * `contentPosition` say, over the placeholder until it is there, with a
 * cross-dissolve of the duration asked between pictures. A tint or a blur
 * is applied to the pixels. The commands play and stop an animated
 * picture and reload it.
 */
struct ImageView : winrt::implements<ImageView, winrt::IInspectable>,
                   Codegen::BaseExpoWindowsImageView<ImageView>,
                   XamlIsland<ImageView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_dispatcher = winrt::Microsoft::UI::Dispatching::DispatcherQueue::GetForCurrentThread();
    m_stage = controls::Canvas{};
    for (auto *image : {&m_placeholder, &m_previous, &m_picture}) {
      *image = controls::Image{};
      image->Stretch(xaml::Media::Stretch::Fill);
      m_stage.Children().Append(*image);
    }
    Attach(islandView, m_stage);
    Root().SizeChanged([weak = get_weak()](winrt::IInspectable const &, xaml::SizeChangedEventArgs const &args) {
      if (auto self = weak.get()) self->Resized(args.NewSize());
    });
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoWindowsImageViewProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoWindowsImageViewProps> &oldProps) noexcept override {
    Codegen::BaseExpoWindowsImageView<ImageView>::UpdateProps(view, newProps, oldProps);
    if (!newProps) return;
    try {
      m_fit = newProps->contentFit.value_or("cover");
      m_placeholderFit = newProps->placeholderContentFit.value_or("scale-down");
      m_position = ParsePosition(newProps->contentPosition);
      m_transition = ParseTransition(newProps->transition);
      m_autoplay = newProps->autoplay;
      m_policy = newProps->cachePolicy.value_or("disk");
      std::string tint = newProps->tintColor.value_or("");
      int blur = static_cast<int>(std::lround(newProps->blurRadius.value_or(0)));
      auto source = FirstSource(newProps->source);
      std::string key = source ? source->uri + "|" + source->cacheKey + "|" + tint + "|" + std::to_string(blur) + "|" + m_policy : "";
      if (key != m_sourceKey) {
        m_sourceKey = key;
        m_source = source;
        m_tint = tint;
        m_blur = blur;
        Load();
      }
      auto placeholder = FirstSource(newProps->placeholder);
      std::string placeholderKey = placeholder ? placeholder->uri : "";
      if (placeholderKey != m_placeholderKey) {
        m_placeholderKey = placeholderKey;
        m_placeholderSource = placeholder;
        LoadPlaceholder();
      }
      Arrange();
    } catch (hresult_error const &) {
    }
  }

  void HandleStartAnimatingCommand() noexcept override {
    try {
      if (m_bitmap && m_bitmap.IsAnimatedBitmap()) m_bitmap.Play();
    } catch (hresult_error const &) {
    }
  }

  void HandleStopAnimatingCommand() noexcept override {
    try {
      if (m_bitmap && m_bitmap.IsAnimatedBitmap()) m_bitmap.Stop();
    } catch (hresult_error const &) {
    }
  }

  void HandleReloadCommand() noexcept override {
    Load();
  }

 private:
  void Resized(winrt::Windows::Foundation::Size size) noexcept {
    try {
      m_size = size;
      xaml::Media::RectangleGeometry clip;
      clip.Rect({0, 0, size.Width, size.Height});
      Root().Clip(clip);
      Arrange();
    } catch (hresult_error const &) {
    }
  }

  double RasterizationScale() const noexcept {
    try {
      if (auto root = Root().XamlRoot()) return root.RasterizationScale();
    } catch (hresult_error const &) {
    }
    return 1;
  }

  /** Sizes and places one of the images for its natural size and a fit. */
  void PlaceImage(controls::Image const &image, Natural const &natural, std::string const &fit) {
    auto placement = Place(natural, m_size.Width, m_size.Height, fit, m_position);
    image.Width(std::max(0.0, placement.width));
    image.Height(std::max(0.0, placement.height));
    controls::Canvas::SetLeft(image, placement.x);
    controls::Canvas::SetTop(image, placement.y);
    if (auto svg = image.Source().try_as<SvgImageSource>()) {
      double scale = RasterizationScale();
      svg.RasterizePixelWidth(std::max(1.0, placement.width * scale));
      svg.RasterizePixelHeight(std::max(1.0, placement.height * scale));
    }
  }

  void Arrange() noexcept {
    if (m_size.Width <= 0 || m_size.Height <= 0) return;
    try {
      PlaceImage(m_picture, m_natural, m_fit);
      PlaceImage(m_previous, m_previousNatural, m_fit);
      PlaceImage(m_placeholder, m_placeholderNatural, m_placeholderFit);
    } catch (hresult_error const &) {
    }
  }

  /** Fetches, decodes and shows the current source; a later load supersedes this one. */
  winrt::fire_and_forget Load() {
    auto self = get_strong();
    const uint32_t generation = ++m_generation;
    m_bitmap = nullptr;
    if (!m_source) {
      m_picture.Source(nullptr);
      m_previous.Source(nullptr);
      m_natural = {};
      m_placeholder.Opacity(1);
      co_return;
    }
    Source source = *m_source;
    if (!m_picture.Source()) m_placeholder.Opacity(1);
    if (auto emitter = EventEmitter()) emitter->onLoadStart(Codegen::ExpoWindowsImageViewSpec_onLoadStart{});
    if (StartsWith(source.uri, "blurhash:/")) {
      auto decoded = DecodeBlurhash(source);
      if (decoded.source) Show(generation, decoded, source.uri, "none");
      else Fail(generation, "The blurhash could not be decoded: " + source.uri);
      co_return;
    }
    if (StartsWith(source.uri, "thumbhash:/")) {
      Fail(generation, "A thumbhash is not decoded on Windows; use a blurhash");
      co_return;
    }
    if (StartsWith(source.uri, "sf:/")) {
      Fail(generation, "SF Symbols are iOS's; expo-symbols draws Segoe Fluent glyphs on Windows");
      co_return;
    }
    const bool memory = (m_policy == "memory" || m_policy == "memory-disk") && m_tint.empty() && m_blur <= 0;
    const std::string key = cache::KeyOf(source.uri, source.cacheKey);
    if (memory) {
      auto cached = cache::FromMemory(key);
      if (cached.source) {
        Show(generation, cached, source.uri, "memory");
        co_return;
      }
    }
    auto fetch = std::make_shared<cache::Fetch>();
    fetch->uri = source.uri;
    fetch->headers = source.headers;
    fetch->cacheKey = source.cacheKey;
    fetch->policy = m_policy;
    fetch->progress = [weak = get_weak(), dispatcher = m_dispatcher, generation](uint64_t loaded, uint64_t total) {
      if (!dispatcher) return;
      dispatcher.TryEnqueue([weak, generation, loaded, total]() {
        if (auto self = weak.get()) {
          if (generation != self->m_generation) return;
          if (auto emitter = self->EventEmitter()) emitter->onProgress({static_cast<int32_t>(loaded), static_cast<int32_t>(total)});
        }
      });
    };
    co_await cache::FetchAsync(fetch);
    if (generation != m_generation) co_return;
    if (!fetch->error.empty()) {
      Fail(generation, fetch->error);
      co_return;
    }
    auto decoded = std::make_shared<cache::Cached>();
    try {
      co_await Decode(fetch, decoded, m_tint, m_blur, m_autoplay);
    } catch (hresult_error const &error) {
      if (generation == m_generation) Fail(generation, ::ExpoWindows::Message(error));
      co_return;
    }
    if (generation != m_generation) co_return;
    if (memory) cache::ToMemory(key, *decoded);
    Show(generation, *decoded, source.uri, fetch->cacheType);
  }

  winrt::fire_and_forget LoadPlaceholder() {
    auto self = get_strong();
    const uint32_t generation = ++m_placeholderGeneration;
    if (!m_placeholderSource) {
      m_placeholder.Source(nullptr);
      m_placeholderNatural = {};
      co_return;
    }
    Source source = *m_placeholderSource;
    if (StartsWith(source.uri, "blurhash:/")) {
      auto decoded = DecodeBlurhash(source);
      if (decoded.source) ShowPlaceholder(decoded);
      co_return;
    }
    if (StartsWith(source.uri, "thumbhash:/") || StartsWith(source.uri, "sf:/")) co_return;
    auto fetch = std::make_shared<cache::Fetch>();
    fetch->uri = source.uri;
    fetch->headers = source.headers;
    fetch->cacheKey = source.cacheKey;
    co_await cache::FetchAsync(fetch);
    if (generation != m_placeholderGeneration || !fetch->error.empty()) co_return;
    auto decoded = std::make_shared<cache::Cached>();
    try {
      co_await Decode(fetch, decoded, "", 0, true);
    } catch (hresult_error const &) {
      co_return;
    }
    if (generation == m_placeholderGeneration) ShowPlaceholder(*decoded);
  }

  void ShowPlaceholder(cache::Cached const &decoded) noexcept {
    try {
      m_placeholder.Source(decoded.source);
      m_placeholderNatural = {static_cast<double>(decoded.width), static_cast<double>(decoded.height)};
      Arrange();
    } catch (hresult_error const &) {
    }
  }

  /** The picture arrived: it takes the place of the one there, dissolving when asked, and the events say so. */
  void Show(uint32_t generation, cache::Cached const &decoded, std::string const &url, std::string const &cacheType) noexcept {
    if (generation != m_generation) return;
    try {
      if (auto current = m_picture.Source()) {
        m_previous.Source(current);
        m_previousNatural = m_natural;
        m_previous.Opacity(1);
      }
      m_picture.Source(decoded.source);
      m_bitmap = decoded.source.try_as<BitmapImage>();
      m_natural = {static_cast<double>(decoded.width), static_cast<double>(decoded.height)};
      Arrange();
      if (auto emitter = EventEmitter()) emitter->onLoad({url, decoded.width, decoded.height, decoded.animated, decoded.mediaType, cacheType});
      if (m_transition.duration > 0) {
        m_picture.Opacity(0);
        Fade(m_picture, 0, 1, [weak = get_weak(), generation]() {
          if (auto self = weak.get()) {
            if (generation != self->m_generation) return;
            self->m_previous.Source(nullptr);
            if (auto emitter = self->EventEmitter()) emitter->onDisplay(Codegen::ExpoWindowsImageViewSpec_onDisplay{});
          }
        });
        if (m_previous.Source()) Fade(m_previous, 1, 0, nullptr);
        Fade(m_placeholder, m_placeholder.Opacity(), 0, nullptr);
      } else {
        m_picture.Opacity(1);
        m_previous.Source(nullptr);
        m_placeholder.Opacity(0);
        if (auto emitter = EventEmitter()) emitter->onDisplay(Codegen::ExpoWindowsImageViewSpec_onDisplay{});
      }
    } catch (hresult_error const &) {
    }
  }

  void Fail(uint32_t generation, std::string const &message) noexcept {
    if (generation != m_generation) return;
    if (auto emitter = EventEmitter()) emitter->onError({message});
  }

  /** Animates an element's opacity over the transition's duration with its timing. */
  void Fade(xaml::UIElement const &element, double from, double to, std::function<void()> done) {
    animation::Storyboard board;
    animation::DoubleAnimation fade;
    fade.From(winrt::Windows::Foundation::IReference<double>(from));
    fade.To(winrt::Windows::Foundation::IReference<double>(to));
    fade.Duration(xaml::Duration{winrt::Windows::Foundation::TimeSpan{std::chrono::milliseconds(m_transition.duration)}, xaml::DurationType::TimeSpan});
    if (m_transition.timing != "linear") {
      animation::CubicEase ease;
      ease.EasingMode(
          m_transition.timing == "ease-in" ? animation::EasingMode::EaseIn : m_transition.timing == "ease-out" ? animation::EasingMode::EaseOut : animation::EasingMode::EaseInOut);
      fade.EasingFunction(ease);
    }
    animation::Storyboard::SetTarget(fade, element);
    animation::Storyboard::SetTargetProperty(fade, L"Opacity");
    board.Children().Append(fade);
    if (done) board.Completed([done](winrt::IInspectable const &, winrt::IInspectable const &) { done(); });
    board.Begin();
  }

  controls::Canvas m_stage{nullptr};
  controls::Image m_placeholder{nullptr};
  controls::Image m_previous{nullptr};
  controls::Image m_picture{nullptr};
  winrt::Microsoft::UI::Dispatching::DispatcherQueue m_dispatcher{nullptr};
  BitmapImage m_bitmap{nullptr};
  winrt::Windows::Foundation::Size m_size{};
  std::optional<Source> m_source;
  std::optional<Source> m_placeholderSource;
  std::string m_sourceKey;
  std::string m_placeholderKey;
  std::string m_fit{"cover"};
  std::string m_placeholderFit{"scale-down"};
  std::string m_policy{"disk"};
  std::string m_tint;
  int m_blur{0};
  bool m_autoplay{true};
  Position m_position{Centered()};
  Transition m_transition;
  Natural m_natural;
  Natural m_previousNatural;
  Natural m_placeholderNatural;
  uint32_t m_generation{0};
  uint32_t m_placeholderGeneration{0};
};

void RegisterImageView(const rn::IReactPackageBuilder &packageBuilder) noexcept {
  RegisterIsland<ImageView>(packageBuilder, &Codegen::RegisterExpoWindowsImageViewNativeComponent<ImageView>);
}

} // namespace winrt::ExpoWindows

#endif // RNW_NEW_ARCH
