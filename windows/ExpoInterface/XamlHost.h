#pragma once

#ifdef RNW_NEW_ARCH

#include "pch.h"
#include "YogaXamlPanel.h"

/**
 * What every kit control hosted in a XAML island shares: the island and the
 * panel that reports its size to Yoga, the scheme and accent the kit passes
 * as props, the color and string conversions, and the JSON the list props
 * cross the boundary as.
 *
 * A component view is `winrt::implements<T, IInspectable>`, the codegen base
 * for its spec, and `XamlIsland<T>`; it creates its control, calls `Attach`
 * from the island initializer and overrides `UpdateProps` to push the props
 * into the control. `RegisterIsland` wires the codegen registration to the
 * island initializer and to native layout.
 */
namespace winrt::ExpoInterface {

namespace xaml = winrt::Microsoft::UI::Xaml;
namespace controls = winrt::Microsoft::UI::Xaml::Controls;
namespace media = winrt::Microsoft::UI::Xaml::Media;
namespace rn = winrt::Microsoft::ReactNative;
namespace composition = winrt::Microsoft::ReactNative::Composition;
using Color = winrt::Windows::UI::Color;
using Size = winrt::Windows::Foundation::Size;

// -- Colors ------------------------------------------------------------------

/** Parses `#RGB`, `#RGBA`, `#RRGGBB` or `#RRGGBBAA`. */
bool TryParseColor(std::string_view hex, Color &color) noexcept;
/** The color a prop names, or `fallback` when the prop is absent or malformed. */
Color ColorOr(const std::optional<std::string> &hex, Color fallback) noexcept;

/** The user's Windows accent color: what the kit falls back to without a seed. */
Color SystemAccent() noexcept;

/** Overrides a control's themed brushes with one brush, in both themes. */
void OverrideBrushes(const xaml::FrameworkElement &element, std::initializer_list<const wchar_t *> keys, Color color) noexcept;

/** WinUI's `AccentButtonStyle`, when the application resources hold it. */
xaml::Style AccentButtonStyle() noexcept;
media::SolidColorBrush Brush(Color color) noexcept;
media::SolidColorBrush Brush(Color color, float opacity) noexcept;
/** `color` moved `amount` (0…1) of the way toward `toward`. */
Color Mix(Color color, Color toward, float amount) noexcept;
/** Whether text on the color should be black (true) or white, by the kit's luma rule. */
bool IsLight(Color color) noexcept;
/** Fluent's critical (destructive) fill for the scheme. */
Color Critical(bool dark) noexcept;
/** `#RRGGBB`, or `#RRGGBBAA` with `alpha`, in upper case. */
std::string ToHex(Color color, bool alpha) noexcept;

// -- Strings -----------------------------------------------------------------

winrt::hstring ToHString(std::string_view utf8) noexcept;
std::string ToUtf8(const winrt::hstring &text) noexcept;
/** The Segoe Fluent Icons character for a code point written in hex (`E72D`). */
winrt::hstring GlyphFromCodePoint(std::string_view hex) noexcept;
/** The `FontIcon` for a code point, sized; empty glyph for an empty code point. */
controls::FontIcon MakeGlyph(std::string_view hex, double size) noexcept;

// -- Theme and accent --------------------------------------------------------

/** `light` / `dark` / anything else follows the system. */
xaml::ElementTheme ThemeFrom(const std::optional<std::string> &theme) noexcept;
/** Whether the element draws in the dark theme. */
bool IsDark(const xaml::FrameworkElement &element) noexcept;
/**
 * Overrides the accent brushes below `element` with ones derived from the
 * kit's seed — the fill of accent buttons, switches, sliders, check marks,
 * progress bars and selection indicators — in both theme dictionaries, the
 * way WinUI derives them from the system accent. Nothing without a seed.
 */
void ApplyAccent(const xaml::FrameworkElement &element, const std::optional<std::string> &accent) noexcept;
/** The scheme and accent props every kit control takes. */
void ApplyLook(
    const xaml::FrameworkElement &element,
    const std::optional<std::string> &theme,
    const std::optional<std::string> &accent) noexcept;
/** Sets the automation name; nothing for an absent label. */
void SetName(const xaml::UIElement &element, const std::optional<std::string> &label) noexcept;
/**
 * Sets the automation id from React Native's `testID`, which every view prop
 * set carries; nothing for an empty one.
 *
 * The name is what a screen reader says, so it is the app's copy and changes
 * with it. The id is what the source called the thing, so a test — and the
 * kit's own harness — can name a control without depending on its wording or
 * its language.
 */
void SetAutomationId(const xaml::UIElement &element, const winrt::hstring &testId) noexcept;
/**
 * Both automation properties at once, on the element that represents the
 * component: the name a screen reader says and the id a test names it by.
 *
 * Which element that is only the component knows. A button's island holds the
 * button itself, but a text field's holds a `Grid` with either a `TextBox` or
 * a `PasswordBox` built inside it, and UI Automation reports the inner control
 * while skipping the panel — so an id left on the panel is invisible to a
 * test. Setting both here keeps them on the same element by construction.
 */
void SetIdentity(
    const xaml::UIElement &element,
    const std::optional<std::string> &label,
    const rn::ViewProps &viewProps) noexcept;

// -- JSON --------------------------------------------------------------------

/** The array a list prop holds; empty when the JSON is not one. */
winrt::Windows::Data::Json::JsonArray ParseArray(const std::string &json) noexcept;
std::string JsonString(const winrt::Windows::Data::Json::JsonObject &object, const wchar_t *key) noexcept;
bool JsonBool(const winrt::Windows::Data::Json::JsonObject &object, const wchar_t *key) noexcept;
/** Whether the entry at `index` is a plain string (a label) rather than an object. */
std::vector<std::string> JsonStrings(const winrt::Windows::Data::Json::JsonArray &array) noexcept;

// -- Native layout -----------------------------------------------------------

/** The state a component keeps for Yoga: the size its XAML content wants. */
struct DesiredSizeState : winrt::implements<DesiredSizeState, winrt::IInspectable> {
  DesiredSizeState(Size size) : desiredSize(size) {}
  Size desiredSize;
};

/**
 * Makes Yoga ask the shadow node for the size the island reported (rounded
 * up to whole pixels), within the constraints the style gives it.
 */
void ConfigureNativeLayout(const composition::IReactCompositionViewComponentBuilder &builder) noexcept;

/** Makes sure WinUI is up before the first island; a host app's own application is kept. */
void EnsureXaml() noexcept;

/**
 * The island mixin. `TDerived` is the component view: it must provide
 * `get_weak()` (from `winrt::implements`) and is given `Attach`, the state
 * bookkeeping for native layout and the props it needs from the codegen base.
 */
template <typename TDerived>
struct XamlIsland {
  /** Hosts `content` in a new island connected to the component view. */
  void Attach(const composition::ContentIslandComponentView &islandView, const xaml::UIElement &content) noexcept {
    EnsureXaml();
    auto self = static_cast<TDerived *>(this);
    m_island = xaml::XamlIsland{};
    m_panel = winrt::make<winrt::ExpoInterface::implementation::YogaXamlPanel>(
        [weak = self->get_weak()](Size size) {
          if (auto strong = weak.get()) {
            strong->ReportDesiredSize(size);
          }
        });
    m_panel.Children().Append(content);
    m_island.Content(m_panel);
    islandView.Connect(m_island.ContentIsland());
    islandView.Destroying([weak = self->get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) {
        strong->CloseIsland();
      }
    });
  }

  /** The panel the control sits in: where the theme and accent are applied. */
  xaml::FrameworkElement Root() const noexcept {
    return m_panel;
  }

  /**
   * The control the island hosts — the element UI Automation reports, and so
   * the one an automation id belongs on. The panel around it is not a control
   * and never appears in the tree a test walks.
   */
  xaml::UIElement Content() const noexcept {
    if (!m_panel || m_panel.Children().Size() == 0) return nullptr;
    return m_panel.Children().GetAt(0);
  }

  /**
   * The scheme, the accent and the automation identity, each applied where it
   * belongs: the look on the panel, so it cascades to everything the control
   * draws, and the id on the control itself.
   *
   * This member hides the free `ApplyLook` for anything deriving from the
   * mixin, which is deliberate — a component that called the old one would no
   * longer compile rather than quietly ship without an automation id.
   */
  void ApplyLook(
      const rn::ViewProps &viewProps,
      const std::optional<std::string> &theme,
      const std::optional<std::string> &accent) noexcept {
    winrt::ExpoInterface::ApplyLook(Root(), theme, accent);
    // Only when the island's content is the control itself. A component that
    // hosts a panel names its own inner control through `SetIdentity`, and an
    // id left on the panel would sit on an element no test can see.
    if (auto content = Content(); content && content.try_as<controls::Control>()) {
      SetAutomationId(content, viewProps.TestId());
    }
  }

  void ReportDesiredSize(Size size) noexcept {
    m_desired = size;
    if (!m_state) {
      return;
    }
    auto current = winrt::get_self<DesiredSizeState>(m_state.Data());
    if (current && current->desiredSize == size) {
      return;
    }
    m_state.UpdateStateWithMutation([size](const winrt::IInspectable &) { return winrt::make<DesiredSizeState>(size); });
  }

  /** The codegen base calls this when overridden: keeps the state to report into. */
  void KeepState(const rn::IComponentState &state) noexcept {
    m_state = state;
    if (m_desired) {
      ReportDesiredSize(*m_desired);
    }
  }

  /**
   * Measures the content again, now, and reports what it wants: for a
   * control whose content a prop replaced (a button's label), so Yoga
   * hears the new size in the same turn rather than after XAML's next
   * layout pass, which the island's unchanged size may never start.
   */
  void Remeasure() noexcept {
    if (!m_panel || m_panel.Children().Size() == 0) return;
    try {
      auto content = m_panel.Children().GetAt(0);
      content.InvalidateMeasure();
      content.Measure({std::numeric_limits<float>::max(), std::numeric_limits<float>::max()});
      auto desired = content.DesiredSize();
      ReportDesiredSize({desired.Width, desired.Height});
      m_panel.InvalidateMeasure();
    } catch (...) {
    }
  }

  void CloseIsland() noexcept {
    if (m_island) {
      m_island.Close();
      m_island = nullptr;
    }
  }

 private:
  xaml::XamlIsland m_island{nullptr};
  winrt::ExpoInterface::YogaXamlPanel m_panel{nullptr};
  rn::IComponentState m_state{nullptr};
  std::optional<Size> m_desired;
};

/**
 * Registers a component view whose content is an island: the codegen
 * registration with the island initializer (which creates the view, hosts
 * its control and stores it as the component's user data) and native layout.
 */
template <typename TView, typename TRegister>
void RegisterIsland(const rn::IReactPackageBuilder &packageBuilder, TRegister registerComponent) noexcept {
  registerComponent(packageBuilder, [](const composition::IReactCompositionViewComponentBuilder &builder) {
    builder.SetContentIslandComponentViewInitializer(
        [](const composition::ContentIslandComponentView &islandView) noexcept {
          // XAML must be up on this thread before the view builds its first control.
          EnsureXaml();
          auto view = winrt::make_self<TView>();
          view->InitializeIsland(islandView);
          islandView.UserData(*view);
        });
    ConfigureNativeLayout(builder);
  });
}

} // namespace winrt::ExpoInterface

#endif // RNW_NEW_ARCH
