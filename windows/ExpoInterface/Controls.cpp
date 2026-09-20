#include "pch.h"

#include "Controls.h"

#ifdef RNW_NEW_ARCH

#include "XamlHost.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceButton.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceCheckBox.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceInfoBadge.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfacePersonPicture.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceProgress.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceToggleButton.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceToggleSwitch.g.h"

namespace winrt::ExpoInterface {

namespace {

// (Not `TRANSPARENT`: that name is a wingdi.h macro.)
const Color kTransparent{0, 0, 0, 0};

// -- Button ------------------------------------------------------------------

struct ButtonView : winrt::implements<ButtonView, winrt::IInspectable>,
                    Codegen::BaseExpoInterfaceButton<ButtonView>,
                    XamlIsland<ButtonView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_button = controls::Button{};
    m_row = controls::StackPanel{};
    m_row.Orientation(controls::Orientation::Horizontal);
    m_row.Spacing(8);
    m_button.Content(m_row);
    m_button.Click([weak = get_weak()](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
      if (auto strong = weak.get()) {
        if (auto emitter = strong->EventEmitter()) {
          emitter->onPress(Codegen::ExpoInterfaceButtonEventEmitter::OnPress{});
        }
      }
    });
    Attach(islandView, m_button);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceButtonProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceButtonProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceButton<ButtonView>::UpdateProps(view, newProps, oldProps);
    Apply();
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  void Apply() noexcept {
    auto props = Props();
    if (!props) return;
    const auto variant = props->variant.value_or("filled");
    const auto size = props->size.value_or("medium");
    const auto shape = props->shape.value_or("default");
    const bool destructive = props->buttonRole == "destructive";
    const bool labelTone = variant == "text" && props->tone == "label" && !destructive;
    const bool iconOnly = props->iconOnly.value_or(false) && props->glyph && !props->glyph->empty();
    const double glyphSize = props->glyphSize.value_or(18.0);

    // The accent the button is branded with: an explicit color, the critical
    // color for the destructive role, or the kit's seed.
    auto accent = props->color ? props->color : props->accentColor;
    ApplyLook(props->ViewProps, props->theme, accent);
    const bool dark = IsDark(Root());
    Color accentColor = ColorOr(accent, SystemAccent());
    if (destructive && !props->color) accentColor = Critical(dark);
    const Color onAccent = IsLight(accentColor) ? Color{255, 0, 0, 0} : Color{255, 255, 255, 255};

    // Content: glyph, label, glyph.
    m_row.Children().Clear();
    if (props->glyph && !props->glyph->empty()) {
      m_row.Children().Append(MakeGlyph(*props->glyph, glyphSize));
    }
    if (!iconOnly) {
      controls::TextBlock text;
      text.Text(ToHString(props->label));
      text.VerticalAlignment(xaml::VerticalAlignment::Center);
      m_row.Children().Append(text);
      if (props->glyphAfter && !props->glyphAfter->empty()) {
        m_row.Children().Append(MakeGlyph(*props->glyphAfter, glyphSize));
      }
    }
    // The label as the accessible name in every case: UI Automation derives
    // none from a panel of glyph and text, so Narrator read "button" alone.
    SetIdentity(m_button, std::optional<std::string>{props->label}, props->ViewProps);

    // Style: the accent button for `filled` (the override brushes above fill
    // it), the standard one otherwise; `text` drops the chrome.
    if (variant == "filled") {
      if (auto style = AccentButtonStyle()) m_button.Style(style);
      if (destructive || props->color) {
        OverrideBrushes(m_button, {L"AccentButtonBackground", L"AccentButtonBorderBrush"}, accentColor);
        OverrideBrushes(m_button, {L"AccentButtonBackgroundPointerOver", L"AccentButtonBorderBrushPointerOver"}, Mix(accentColor, dark ? Color{255, 0, 0, 0} : Color{255, 255, 255, 255}, 0.1f));
        OverrideBrushes(m_button, {L"AccentButtonBackgroundPressed", L"AccentButtonBorderBrushPressed"}, Mix(accentColor, dark ? Color{255, 0, 0, 0} : Color{255, 255, 255, 255}, 0.2f));
        OverrideBrushes(m_button, {L"AccentButtonForeground", L"AccentButtonForegroundPointerOver", L"AccentButtonForegroundPressed"}, onAccent);
      }
    } else {
      m_button.ClearValue(xaml::FrameworkElement::StyleProperty());
      const Color content = labelTone ? (dark ? Color{255, 255, 255, 255} : Color{255, 0, 0, 0}) : accentColor;
      OverrideBrushes(m_button, {L"ButtonForeground", L"ButtonForegroundPointerOver", L"ButtonForegroundPressed"}, content);
      if (variant == "text") {
        OverrideBrushes(m_button, {L"ButtonBackground", L"ButtonBorderBrush", L"ButtonBorderBrushPointerOver", L"ButtonBorderBrushPressed"}, kTransparent);
      } else {
        OverrideBrushes(m_button, {L"ButtonBorderBrush", L"ButtonBorderBrushPointerOver"}, Brush(accentColor).Color());
      }
    }

    // Size.
    double fontSize = 14;
    double minHeight = 32;
    xaml::Thickness padding{11, 5, 11, 6};
    if (size == "inline") {
      fontSize = 14;
      minHeight = 0;
      padding = {0, 0, 0, 0};
    } else if (size == "small") {
      fontSize = 12;
      minHeight = 24;
      padding = {8, 3, 8, 3};
    } else if (size == "large") {
      fontSize = 16;
      minHeight = 40;
      padding = {16, 8, 16, 8};
    }
    if (iconOnly) {
      padding = {padding.Top + 2, padding.Top, padding.Top + 2, padding.Bottom};
      m_button.MinWidth(minHeight);
    } else {
      m_button.MinWidth(0);
    }
    m_button.FontSize(fontSize);
    m_button.MinHeight(minHeight);
    m_button.Padding(padding);

    // Shape: Fluent's 4-point corner by default.
    if (shape == "pill" || shape == "circle") {
      m_button.CornerRadius(xaml::CornerRadius{999, 999, 999, 999});
    } else if (shape == "rounded") {
      m_button.CornerRadius(xaml::CornerRadius{4, 4, 4, 4});
    } else {
      m_button.ClearValue(controls::Control::CornerRadiusProperty());
    }
    if (shape == "circle") {
      m_button.Width(minHeight);
      m_button.Padding({0, 0, 0, 0});
    } else {
      m_button.ClearValue(xaml::FrameworkElement::WidthProperty());
    }

    m_button.HorizontalAlignment(props->fillWidth.value_or(false) ? xaml::HorizontalAlignment::Stretch : xaml::HorizontalAlignment::Left);
    m_button.IsEnabled(!props->disabled.value_or(false));
    // The content changed under the island: Yoga hears the new size now,
    // not at a layout pass the island's unchanged size may never start.
    Remeasure();
  }

  controls::Button m_button{nullptr};
  controls::StackPanel m_row{nullptr};
};

// -- ToggleSwitch ------------------------------------------------------------

struct ToggleSwitchView : winrt::implements<ToggleSwitchView, winrt::IInspectable>,
                          Codegen::BaseExpoInterfaceToggleSwitch<ToggleSwitchView>,
                          XamlIsland<ToggleSwitchView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_toggle = controls::ToggleSwitch{};
    m_toggle.OnContent(nullptr);
    m_toggle.OffContent(nullptr);
    m_toggle.Header(nullptr);
    m_toggle.MinWidth(0);
    m_toggle.Padding({0, 0, 0, 0});
    m_toggle.Toggled([weak = get_weak()](const winrt::IInspectable &sender, const xaml::RoutedEventArgs &) {
      if (auto strong = weak.get()) {
        if (strong->m_applying) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceToggleSwitchEventEmitter::OnValueChange args;
          args.value = sender.as<controls::ToggleSwitch>().IsOn();
          emitter->onValueChange(std::move(args));
        }
      }
    });
    Attach(islandView, m_toggle);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceToggleSwitchProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceToggleSwitchProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceToggleSwitch<ToggleSwitchView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    m_applying = true;
    ApplyLook(props->ViewProps, props->theme, props->color ? props->color : props->accentColor);
    m_toggle.IsOn(props->value);
    m_toggle.IsEnabled(!props->disabled.value_or(false));
    m_applying = false;
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  controls::ToggleSwitch m_toggle{nullptr};
  bool m_applying{false};
};

// -- CheckBox ----------------------------------------------------------------

struct CheckBoxView : winrt::implements<CheckBoxView, winrt::IInspectable>,
                      Codegen::BaseExpoInterfaceCheckBox<CheckBoxView>,
                      XamlIsland<CheckBoxView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_box = controls::CheckBox{};
    m_box.Content(nullptr);
    m_box.MinWidth(0);
    m_box.Padding({0, 0, 0, 0});
    auto report = [weak = get_weak()](const winrt::IInspectable &sender, const xaml::RoutedEventArgs &) {
      if (auto strong = weak.get()) {
        if (strong->m_applying) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceCheckBoxEventEmitter::OnValueChange args;
          auto checked = sender.as<controls::CheckBox>().IsChecked();
          args.value = checked && checked.Value();
          emitter->onValueChange(std::move(args));
        }
      }
    };
    m_box.Checked(report);
    m_box.Unchecked(report);
    Attach(islandView, m_box);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceCheckBoxProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceCheckBoxProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceCheckBox<CheckBoxView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    m_applying = true;
    ApplyLook(props->ViewProps, props->theme, props->color ? props->color : props->accentColor);
    m_box.IsChecked(props->value);
    m_box.IsEnabled(!props->disabled.value_or(false));
    SetIdentity(m_box, props->label, props->ViewProps);
    m_applying = false;
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  controls::CheckBox m_box{nullptr};
  bool m_applying{false};
};

// -- ToggleButton (icon toggle) ----------------------------------------------

struct ToggleButtonView : winrt::implements<ToggleButtonView, winrt::IInspectable>,
                          Codegen::BaseExpoInterfaceToggleButton<ToggleButtonView>,
                          XamlIsland<ToggleButtonView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_button = controls::Primitives::ToggleButton{};
    m_icon = MakeGlyph("", 24);
    m_button.Content(m_icon);
    m_button.Padding({6, 6, 6, 6});
    m_button.CornerRadius(xaml::CornerRadius{999, 999, 999, 999});
    m_button.MinWidth(0);
    m_button.MinHeight(0);
    // The two colors say the state; the button's own checked fill would say it twice.
    OverrideBrushes(m_button, {L"ToggleButtonBackground", L"ToggleButtonBackgroundChecked", L"ToggleButtonBorderBrush", L"ToggleButtonBorderBrushChecked", L"ToggleButtonBorderBrushPointerOver", L"ToggleButtonBorderBrushCheckedPointerOver", L"ToggleButtonBorderBrushPressed", L"ToggleButtonBorderBrushCheckedPressed"}, kTransparent);
    auto report = [weak = get_weak()](const winrt::IInspectable &sender, const xaml::RoutedEventArgs &) {
      if (auto strong = weak.get()) {
        if (strong->m_applying) return;
        auto checked = sender.as<controls::Primitives::ToggleButton>().IsChecked();
        strong->Paint(checked && checked.Value());
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceToggleButtonEventEmitter::OnValueChange args;
          args.value = checked && checked.Value();
          emitter->onValueChange(std::move(args));
        }
      }
    };
    m_button.Checked(report);
    m_button.Unchecked(report);
    Attach(islandView, m_button);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceToggleButtonProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceToggleButtonProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceToggleButton<ToggleButtonView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    m_applying = true;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    m_button.IsChecked(props->value);
    m_button.IsEnabled(!props->disabled.value_or(false));
    SetIdentity(m_button, std::optional<std::string>{props->label}, props->ViewProps);
    Paint(props->value);
    m_applying = false;
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  void Paint(bool on) noexcept {
    auto props = Props();
    if (!props) return;
    const bool dark = IsDark(Root());
    const auto glyph = on && props->activeGlyph && !props->activeGlyph->empty() ? *props->activeGlyph : props->glyph;
    m_icon.Glyph(GlyphFromCodePoint(glyph));
    m_icon.FontSize(props->size);
    const Color onColor = ColorOr(props->color, ColorOr(props->accentColor, SystemAccent()));
    const Color offColor = ColorOr(props->offColor, dark ? Color{0xC5, 255, 255, 255} : Color{0x9E, 0, 0, 0});
    const Color color = on ? onColor : offColor;
    OverrideBrushes(m_button, {L"ToggleButtonForeground", L"ToggleButtonForegroundChecked", L"ToggleButtonForegroundPointerOver", L"ToggleButtonForegroundCheckedPointerOver", L"ToggleButtonForegroundPressed", L"ToggleButtonForegroundCheckedPressed"}, color);
    m_icon.Foreground(Brush(color));
  }

  controls::Primitives::ToggleButton m_button{nullptr};
  controls::FontIcon m_icon{nullptr};
  bool m_applying{false};
};

// -- Progress ----------------------------------------------------------------

struct ProgressView : winrt::implements<ProgressView, winrt::IInspectable>,
                      Codegen::BaseExpoInterfaceProgress<ProgressView>,
                      XamlIsland<ProgressView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_root = controls::Grid{};
    Attach(islandView, m_root);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceProgressProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceProgressProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceProgress<ProgressView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    ApplyLook(props->ViewProps, props->theme, props->color ? props->color : props->accentColor);
    const bool circular = props->variant == "circular";
    // Defaulted numbers come through codegen as plain values, not optionals.
    const double value = props->value;
    const bool indeterminate = value < 0;
    if (circular != m_circular || (!m_bar && !m_ring)) {
      m_root.Children().Clear();
      m_bar = nullptr;
      m_ring = nullptr;
      m_circular = circular;
      if (circular) {
        m_ring = controls::ProgressRing{};
        m_root.Children().Append(m_ring);
      } else {
        m_bar = controls::ProgressBar{};
        m_bar.Minimum(0);
        m_bar.Maximum(1);
        m_bar.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
        m_bar.MinWidth(0);
        m_root.Children().Append(m_bar);
      }
    }
    Color fill{};
    const bool hasFill = props->color && TryParseColor(*props->color, fill);
    Color track{};
    const bool hasTrack = props->trackColor && TryParseColor(*props->trackColor, track);
    if (m_ring) {
      const double size = props->size;
      m_ring.Width(size);
      m_ring.Height(size);
      m_ring.IsIndeterminate(indeterminate);
      m_ring.IsActive(true);
      m_ring.Minimum(0);
      m_ring.Maximum(1);
      if (!indeterminate) m_ring.Value(value);
      if (hasFill) m_ring.Foreground(Brush(fill)); else m_ring.ClearValue(controls::Control::ForegroundProperty());
      if (hasTrack) m_ring.Background(Brush(track)); else m_ring.ClearValue(controls::Control::BackgroundProperty());
    }
    if (m_bar) {
      m_bar.IsIndeterminate(indeterminate);
      if (!indeterminate) m_bar.Value(value);
      if (hasFill) m_bar.Foreground(Brush(fill)); else m_bar.ClearValue(controls::Control::ForegroundProperty());
      if (hasTrack) m_bar.Background(Brush(track)); else m_bar.ClearValue(controls::Control::BackgroundProperty());
    }
    SetIdentity(m_root, props->label, props->ViewProps);
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  controls::Grid m_root{nullptr};
  controls::ProgressBar m_bar{nullptr};
  controls::ProgressRing m_ring{nullptr};
  bool m_circular{false};
};

// -- PersonPicture -----------------------------------------------------------

struct PersonPictureView : winrt::implements<PersonPictureView, winrt::IInspectable>,
                           Codegen::BaseExpoInterfacePersonPicture<PersonPictureView>,
                           XamlIsland<PersonPictureView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_picture = controls::PersonPicture{};
    Attach(islandView, m_picture);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfacePersonPictureProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfacePersonPictureProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfacePersonPicture<PersonPictureView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    ApplyLook(props->ViewProps, props->theme, std::nullopt);
    const double size = props->size;
    m_picture.Width(size);
    m_picture.Height(size);
    m_picture.Initials(ToHString(props->initials));
    m_picture.DisplayName(ToHString(props->displayName));
    Color fill{};
    if (TryParseColor(props->color, fill)) {
      OverrideBrushes(m_picture, {L"PersonPictureEllipseFillThemeBrush", L"PersonPictureEllipseBadgeFillThemeBrush"}, fill);
      OverrideBrushes(m_picture, {L"PersonPictureForegroundThemeBrush"}, IsLight(fill) ? Color{255, 0, 0, 0} : Color{255, 255, 255, 255});
    }
    SetIdentity(m_picture, std::optional<std::string>{props->displayName}, props->ViewProps);
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  controls::PersonPicture m_picture{nullptr};
};

// -- InfoBadge ---------------------------------------------------------------

struct InfoBadgeView : winrt::implements<InfoBadgeView, winrt::IInspectable>,
                       Codegen::BaseExpoInterfaceInfoBadge<InfoBadgeView>,
                       XamlIsland<InfoBadgeView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_badge = controls::InfoBadge{};
    Attach(islandView, m_badge);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceInfoBadgeProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceInfoBadgeProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceInfoBadge<InfoBadgeView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    // `InfoBadge` shows a number when it has one and its dot form when it does
    // not, and a negative value is how it is told there is none.
    m_badge.Value(props->value);

    const auto fill = ColorOr(props->color, Critical(IsDark(m_badge)));
    m_badge.Background(Brush(fill));
    m_badge.Foreground(Brush(ColorOr(props->textColor, IsLight(fill) ? Color{255, 0, 0, 0} : Color{255, 255, 255, 255})));
    // The label rather than the number: "3" announced on its own says nothing,
    // and it is also where an overflowing count keeps its real wording.
    SetIdentity(m_badge, props->label, props->ViewProps);
    Remeasure();
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  controls::InfoBadge m_badge{nullptr};
};

} // namespace

void RegisterControls(rn::IReactPackageBuilder const &packageBuilder) noexcept {
  RegisterIsland<ButtonView>(packageBuilder, &Codegen::RegisterExpoInterfaceButtonNativeComponent<ButtonView>);
  RegisterIsland<ToggleSwitchView>(packageBuilder, &Codegen::RegisterExpoInterfaceToggleSwitchNativeComponent<ToggleSwitchView>);
  RegisterIsland<CheckBoxView>(packageBuilder, &Codegen::RegisterExpoInterfaceCheckBoxNativeComponent<CheckBoxView>);
  RegisterIsland<ToggleButtonView>(packageBuilder, &Codegen::RegisterExpoInterfaceToggleButtonNativeComponent<ToggleButtonView>);
  RegisterIsland<ProgressView>(packageBuilder, &Codegen::RegisterExpoInterfaceProgressNativeComponent<ProgressView>);
  RegisterIsland<PersonPictureView>(packageBuilder, &Codegen::RegisterExpoInterfacePersonPictureNativeComponent<PersonPictureView>);
  RegisterIsland<InfoBadgeView>(packageBuilder, &Codegen::RegisterExpoInterfaceInfoBadgeNativeComponent<InfoBadgeView>);
}

} // namespace winrt::ExpoInterface

#else

namespace winrt::ExpoInterface {
void RegisterControls(winrt::Microsoft::ReactNative::IReactPackageBuilder const &) noexcept {}
} // namespace winrt::ExpoInterface

#endif // RNW_NEW_ARCH
