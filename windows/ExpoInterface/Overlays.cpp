#include "pch.h"

#include "Overlays.h"

#ifdef RNW_NEW_ARCH

#include "XamlHost.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceContentDialog.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceFlyout.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceInfoBar.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceMenuFlyout.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceNavigationView.g.h"

namespace winrt::ExpoInterface {

namespace {

using JsonObject = winrt::Windows::Data::Json::JsonObject;
using JsonValueType = winrt::Windows::Data::Json::JsonValueType;

/** An empty, transparent element for a flyout or dialog to be placed against; takes no presses. */
controls::Grid MakeAnchor() noexcept {
  controls::Grid anchor;
  anchor.IsHitTestVisible(false);
  anchor.Background(nullptr);
  anchor.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
  anchor.VerticalAlignment(xaml::VerticalAlignment::Stretch);
  return anchor;
}

/** A button drawn as text alone, in a color: the actions of a flyout. */
controls::Button MakeTextButton(const std::string &label, Color color) noexcept {
  controls::Button button;
  button.Content(winrt::box_value(ToHString(label)));
  auto resources = button.Resources();
  for (auto key : {L"ButtonBackground", L"ButtonBorderBrush", L"ButtonBorderBrushPointerOver", L"ButtonBorderBrushPressed"}) {
    resources.Insert(winrt::box_value(key), Brush(Color{0, 0, 0, 0}));
  }
  for (auto key : {L"ButtonForeground", L"ButtonForegroundPointerOver", L"ButtonForegroundPressed"}) {
    resources.Insert(winrt::box_value(key), Brush(color));
  }
  return button;
}

// -- MenuFlyout --------------------------------------------------------------

struct MenuFlyoutView : winrt::implements<MenuFlyoutView, winrt::IInspectable>,
                        Codegen::BaseExpoInterfaceMenuFlyout<MenuFlyoutView>,
                        XamlIsland<MenuFlyoutView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_anchor = MakeAnchor();
    m_flyout = controls::MenuFlyout{};
    m_flyout.Closed([weak = get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) {
        strong->m_open = false;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceMenuFlyoutEventEmitter::OnOpenChange event;
          event.open = false;
          emitter->onOpenChange(std::move(event));
        }
      }
    });
    Attach(islandView, m_anchor);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceMenuFlyoutProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceMenuFlyoutProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceMenuFlyout<MenuFlyoutView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    ApplyLook(Root(), props->theme, props->accentColor);
    if (props->items != m_items) {
      m_items = props->items;
      Build(ParseArray(m_items));
    }
    if (props->open && !m_open) {
      Show(props->atPoint.value_or(false), props->x.value_or(0.0), props->y.value_or(0.0));
    } else if (!props->open && m_open) {
      m_flyout.Hide();
    }
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  void Build(const winrt::Windows::Data::Json::JsonArray &entries) noexcept {
    m_flyout.Items().Clear();
    const bool dark = IsDark(Root());
    int32_t index = 0;
    for (auto value : entries) {
      const int32_t current = index++;
      if (value.ValueType() != JsonValueType::Object) continue;
      auto entry = value.GetObject();
      if (JsonBool(entry, L"separator") && m_flyout.Items().Size() > 0) {
        m_flyout.Items().Append(controls::MenuFlyoutSeparator{});
      }
      controls::MenuFlyoutItem item{nullptr};
      if (JsonBool(entry, L"active")) {
        controls::ToggleMenuFlyoutItem toggle;
        toggle.IsChecked(true);
        item = toggle;
      } else {
        item = controls::MenuFlyoutItem{};
      }
      item.Text(ToHString(JsonString(entry, L"label")));
      const auto swatch = JsonString(entry, L"swatch");
      const auto glyph = JsonString(entry, L"glyph");
      Color swatchColor;
      if (!swatch.empty() && TryParseColor(swatch, swatchColor)) {
        // A solid circle in the swatch's color, where the icon goes.
        auto dot = MakeGlyph("E91F", 16);
        dot.Foreground(Brush(swatchColor));
        item.Icon(dot);
      } else if (!glyph.empty()) {
        item.Icon(MakeGlyph(glyph, 16));
      }
      if (JsonBool(entry, L"destructive")) item.Foreground(Brush(Critical(dark)));
      item.IsEnabled(!JsonBool(entry, L"disabled"));
      item.Click([weak = get_weak(), current](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
        if (auto strong = weak.get()) {
          if (auto emitter = strong->EventEmitter()) {
            Codegen::ExpoInterfaceMenuFlyoutEventEmitter::OnSelect event;
            event.index = current;
            emitter->onSelect(std::move(event));
          }
        }
      });
      m_flyout.Items().Append(item);
    }
  }

  void Show(bool atPoint, double x, double y) noexcept {
    if (!m_anchor.XamlRoot()) {
      // Not in the tree yet: shown once it is.
      m_anchor.Loaded([weak = get_weak(), atPoint, x, y](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
        if (auto strong = weak.get()) {
          if (auto props = strong->Props(); props && props->open && !strong->m_open) strong->Show(atPoint, x, y);
        }
      });
      return;
    }
    m_open = true;
    controls::Primitives::FlyoutShowOptions options;
    if (atPoint) {
      options.Position(winrt::Windows::Foundation::Point{static_cast<float>(x), static_cast<float>(y)});
      options.Placement(controls::Primitives::FlyoutPlacementMode::BottomEdgeAlignedLeft);
    } else {
      options.Placement(controls::Primitives::FlyoutPlacementMode::BottomEdgeAlignedRight);
    }
    m_flyout.ShowAt(m_anchor, options);
    if (auto emitter = EventEmitter()) {
      Codegen::ExpoInterfaceMenuFlyoutEventEmitter::OnOpenChange event;
      event.open = true;
      emitter->onOpenChange(std::move(event));
    }
  }

  controls::Grid m_anchor{nullptr};
  controls::MenuFlyout m_flyout{nullptr};
  std::string m_items;
  bool m_open{false};
};

// -- ContentDialog -----------------------------------------------------------

/**
 * A modal dialog over the whole window. WinUI's `ContentDialog` covers its
 * XamlRoot, and an island's XamlRoot is the island itself, so the dialog is
 * a windowed popup sized to the app window instead: a smoke layer and a card
 * in ContentDialog's arrangement — the title and the message in the body,
 * the first two actions across the bottom as the primary and secondary
 * buttons, the cancel action as the close button, any more in the body.
 */
struct ContentDialogView : winrt::implements<ContentDialogView, winrt::IInspectable>,
                           Codegen::BaseExpoInterfaceContentDialog<ContentDialogView>,
                           XamlIsland<ContentDialogView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_anchor = MakeAnchor();
    Attach(islandView, m_anchor);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceContentDialogProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceContentDialogProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceContentDialog<ContentDialogView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    ApplyLook(Root(), props->theme, props->accentColor);
    if (props->open && !m_popup) {
      Show();
    } else if (!props->open && m_popup) {
      Close(-1);
    }
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  struct Action {
    int32_t index;
    std::string label;
    bool destructive;
  };

  /** The app window's client area as popup offsets from the anchor and a size, in DIPs. */
  bool WindowFrame(const xaml::XamlRoot &root, double &offsetX, double &offsetY, double &width, double &height) noexcept {
    try {
      const float scale = root.RasterizationScale();
      // The window id of a top-level window is its HWND.
      auto hwnd = reinterpret_cast<HWND>(static_cast<uintptr_t>(root.ContentIslandEnvironment().AppWindowId().Value));
      RECT client{};
      POINT origin{};
      if (!hwnd || !GetClientRect(hwnd, &client) || !ClientToScreen(hwnd, &origin)) return false;
      auto anchor = root.CoordinateConverter().ConvertLocalToScreen(winrt::Windows::Foundation::Point{0, 0});
      offsetX = (origin.x - anchor.X) / scale;
      offsetY = (origin.y - anchor.Y) / scale;
      width = (client.right - client.left) / scale;
      height = (client.bottom - client.top) / scale;
      return width > 0 && height > 0;
    } catch (...) {
      return false;
    }
  }

  controls::Button MakeDialogButton(const std::string &label, bool accent, Color accentColor, bool dark) noexcept {
    controls::Button button;
    button.Content(winrt::box_value(ToHString(label)));
    button.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
    button.MinHeight(32);
    if (accent) {
      if (auto style = AccentButtonStyle()) button.Style(style);
      const Color onAccent = IsLight(accentColor) ? Color{255, 0, 0, 0} : Color{255, 255, 255, 255};
      OverrideBrushes(button, {L"AccentButtonBackground", L"AccentButtonBorderBrush"}, accentColor);
      OverrideBrushes(button, {L"AccentButtonBackgroundPointerOver", L"AccentButtonBorderBrushPointerOver"}, Mix(accentColor, dark ? Color{255, 0, 0, 0} : Color{255, 255, 255, 255}, 0.1f));
      OverrideBrushes(button, {L"AccentButtonBackgroundPressed", L"AccentButtonBorderBrushPressed"}, Mix(accentColor, dark ? Color{255, 0, 0, 0} : Color{255, 255, 255, 255}, 0.2f));
      OverrideBrushes(button, {L"AccentButtonForeground", L"AccentButtonForegroundPointerOver", L"AccentButtonForegroundPressed"}, onAccent);
    }
    return button;
  }

  void Show() noexcept {
    auto props = Props();
    if (!props) return;
    auto root = m_anchor.XamlRoot();
    if (!root) {
      m_anchor.Loaded([weak = get_weak()](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
        if (auto strong = weak.get()) {
          if (auto props = strong->Props(); props && props->open && !strong->m_popup) strong->Show();
        }
      });
      return;
    }

    double offsetX = 0, offsetY = 0, width = 0, height = 0;
    if (!WindowFrame(root, offsetX, offsetY, width, height)) {
      width = root.Size().Width;
      height = root.Size().Height;
    }

    std::vector<Action> others;
    std::optional<Action> cancel;
    int32_t index = 0;
    for (auto value : ParseArray(props->actions)) {
      const int32_t current = index++;
      if (value.ValueType() != JsonValueType::Object) continue;
      auto entry = value.GetObject();
      const auto role = JsonString(entry, L"role");
      Action action{current, JsonString(entry, L"label"), role == "destructive"};
      if (role == "cancel" && !cancel) cancel = action;
      else others.push_back(action);
    }
    m_cancel = cancel ? cancel->index : -1;
    m_picked = -1;

    const bool dark = IsDark(Root());
    const Color accent = ColorOr(props->accentColor, SystemAccent());
    const Color base = dark ? Color{255, 0x20, 0x20, 0x20} : Color{255, 0xF3, 0xF3, 0xF3};
    const Color layer = dark ? Color{15, 255, 255, 255} : Color{255, 255, 255, 255};
    const Color stroke = dark ? Color{20, 255, 255, 255} : Color{15, 0, 0, 0};

    // The body: title, message, extra actions.
    controls::StackPanel body;
    body.Padding({24, 24, 24, 24});
    body.Background(Brush(layer));
    body.CornerRadius({8, 8, 0, 0});
    controls::TextBlock title;
    title.Text(ToHString(props->title));
    title.FontSize(20);
    title.FontWeight(winrt::Microsoft::UI::Text::FontWeights::SemiBold());
    title.TextWrapping(xaml::TextWrapping::Wrap);
    body.Children().Append(title);
    if (props->message && !props->message->empty()) {
      controls::TextBlock message;
      message.Text(ToHString(*props->message));
      message.TextWrapping(xaml::TextWrapping::Wrap);
      message.Margin({0, 12, 0, 0});
      body.Children().Append(message);
    }
    if (others.size() > 2) {
      controls::StackPanel extra;
      extra.Orientation(controls::Orientation::Horizontal);
      extra.Spacing(8);
      extra.Margin({0, 16, 0, 0});
      for (size_t i = 2; i < others.size(); ++i) {
        auto button = MakeTextButton(others[i].label, others[i].destructive ? Critical(dark) : accent);
        const int32_t picked = others[i].index;
        button.Click([weak = get_weak(), picked](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
          if (auto strong = weak.get()) strong->Close(picked);
        });
        extra.Children().Append(button);
      }
      body.Children().Append(extra);
    }

    // The button row: primary, secondary, close — equal widths, like ContentDialog.
    controls::Grid row;
    row.Padding({24, 24, 24, 24});
    row.ColumnSpacing(8);
    controls::Button first{nullptr};
    auto place = [&](const controls::Button &button) {
      controls::ColumnDefinition column;
      column.Width(xaml::GridLength{1, xaml::GridUnitType::Star});
      row.ColumnDefinitions().Append(column);
      controls::Grid::SetColumn(button, static_cast<int32_t>(row.ColumnDefinitions().Size() - 1));
      row.Children().Append(button);
      if (!first) first = button;
    };
    for (size_t i = 0; i < others.size() && i < 2; ++i) {
      const bool destructive = others[i].destructive;
      auto button = MakeDialogButton(others[i].label, i == 0, destructive ? Critical(dark) : accent, dark);
      if (destructive && i != 0) {
        OverrideBrushes(button, {L"ButtonForeground", L"ButtonForegroundPointerOver", L"ButtonForegroundPressed"}, Critical(dark));
      }
      const int32_t picked = others[i].index;
      button.Click([weak = get_weak(), picked](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
        if (auto strong = weak.get()) strong->Close(picked);
      });
      place(button);
    }
    if (cancel) {
      auto button = MakeDialogButton(cancel->label, false, accent, dark);
      const int32_t picked = cancel->index;
      button.Click([weak = get_weak(), picked](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
        if (auto strong = weak.get()) strong->Close(picked);
      });
      place(button);
    }

    // The card, centered on a smoke layer the size of the window.
    controls::StackPanel column;
    column.Children().Append(body);
    if (row.Children().Size() > 0) column.Children().Append(row);
    controls::Border card;
    card.Child(column);
    card.MinWidth(320);
    card.MaxWidth(548);
    card.Background(Brush(base));
    card.BorderBrush(Brush(stroke));
    card.BorderThickness({1, 1, 1, 1});
    card.CornerRadius({8, 8, 8, 8});
    card.HorizontalAlignment(xaml::HorizontalAlignment::Center);
    card.VerticalAlignment(xaml::VerticalAlignment::Center);
    controls::Grid smoke;
    smoke.Width(width);
    smoke.Height(height);
    smoke.Background(Brush(Color{77, 0, 0, 0}));
    smoke.RequestedTheme(Root().RequestedTheme());
    smoke.Children().Append(card);
    smoke.KeyDown([weak = get_weak()](const winrt::IInspectable &, const xaml::Input::KeyRoutedEventArgs &args) {
      if (args.Key() != winrt::Windows::System::VirtualKey::Escape) return;
      if (auto strong = weak.get()) {
        args.Handled(true);
        strong->Close(strong->m_cancel);
      }
    });

    controls::Primitives::Popup popup;
    popup.XamlRoot(root);
    popup.ShouldConstrainToRootBounds(false);
    popup.IsLightDismissEnabled(false);
    popup.HorizontalOffset(offsetX);
    popup.VerticalOffset(offsetY);
    popup.Child(smoke);
    popup.Closed([weak = get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) strong->OnClosed();
    });
    m_popup = popup;
    try {
      popup.IsOpen(true);
    } catch (...) {
      m_popup = nullptr;
      return;
    }
    if (first) first.Focus(xaml::FocusState::Programmatic);
  }

  void Close(int32_t picked) noexcept {
    if (!m_popup) return;
    m_picked = picked;
    m_popup.IsOpen(false);
  }

  void OnClosed() noexcept {
    if (!m_popup) return;
    m_popup = nullptr;
    const int32_t picked = m_picked < 0 ? m_cancel : m_picked;
    if (auto emitter = EventEmitter()) {
      Codegen::ExpoInterfaceContentDialogEventEmitter::OnClose event;
      event.index = picked;
      emitter->onClose(std::move(event));
    }
  }

  controls::Grid m_anchor{nullptr};
  controls::Primitives::Popup m_popup{nullptr};
  int32_t m_cancel{-1};
  int32_t m_picked{-1};
};

// -- Flyout (popover) --------------------------------------------------------

struct FlyoutView : winrt::implements<FlyoutView, winrt::IInspectable>,
                    Codegen::BaseExpoInterfaceFlyout<FlyoutView>,
                    XamlIsland<FlyoutView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_anchor = MakeAnchor();
    m_flyout = controls::Flyout{};
    m_flyout.Placement(controls::Primitives::FlyoutPlacementMode::Bottom);
    m_flyout.Closed([weak = get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) {
        strong->m_open = false;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceFlyoutEventEmitter::OnOpenChange event;
          event.open = false;
          emitter->onOpenChange(std::move(event));
        }
      }
    });
    Attach(islandView, m_anchor);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceFlyoutProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceFlyoutProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceFlyout<FlyoutView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    ApplyLook(Root(), props->theme, props->accentColor);
    Build();
    if (props->open && !m_open) {
      Show();
    } else if (!props->open && m_open) {
      m_flyout.Hide();
    }
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  void Build() noexcept {
    auto props = Props();
    if (!props) return;
    const bool dark = IsDark(Root());
    controls::StackPanel content;
    content.Width(props->width);
    content.Spacing(4);
    if (props->title && !props->title->empty()) {
      controls::TextBlock title;
      title.Text(ToHString(*props->title));
      title.FontWeight(winrt::Microsoft::UI::Text::FontWeights::SemiBold());
      title.TextWrapping(xaml::TextWrapping::Wrap);
      content.Children().Append(title);
    }
    if (props->message && !props->message->empty()) {
      controls::TextBlock message;
      message.Text(ToHString(*props->message));
      message.TextWrapping(xaml::TextWrapping::Wrap);
      message.Opacity(0.8);
      content.Children().Append(message);
    }
    auto actions = ParseArray(props->actions);
    if (actions.Size() > 0) {
      controls::StackPanel row;
      row.Orientation(controls::Orientation::Horizontal);
      row.Spacing(8);
      row.Margin({0, 8, 0, 0});
      int32_t index = 0;
      for (auto value : actions) {
        const int32_t current = index++;
        if (value.ValueType() != JsonValueType::Object) continue;
        auto entry = value.GetObject();
        const bool destructive = JsonString(entry, L"role") == "destructive";
        auto button = MakeTextButton(JsonString(entry, L"label"), destructive ? Critical(dark) : ColorOr(props->accentColor, SystemAccent()));
        button.Click([weak = get_weak(), current](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
          if (auto strong = weak.get()) {
            if (auto emitter = strong->EventEmitter()) {
              Codegen::ExpoInterfaceFlyoutEventEmitter::OnAction event;
              event.index = current;
              emitter->onAction(std::move(event));
            }
            strong->m_flyout.Hide();
          }
        });
        row.Children().Append(button);
      }
      content.Children().Append(row);
    }
    m_flyout.Content(content);
  }

  void Show() noexcept {
    if (!m_anchor.XamlRoot()) {
      m_anchor.Loaded([weak = get_weak()](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
        if (auto strong = weak.get()) {
          if (auto props = strong->Props(); props && props->open && !strong->m_open) strong->Show();
        }
      });
      return;
    }
    m_open = true;
    m_flyout.ShowAt(m_anchor);
    if (auto emitter = EventEmitter()) {
      Codegen::ExpoInterfaceFlyoutEventEmitter::OnOpenChange event;
      event.open = true;
      emitter->onOpenChange(std::move(event));
    }
  }

  controls::Grid m_anchor{nullptr};
  controls::Flyout m_flyout{nullptr};
  bool m_open{false};
};

// -- InfoBar -----------------------------------------------------------------

struct InfoBarView : winrt::implements<InfoBarView, winrt::IInspectable>,
                     Codegen::BaseExpoInterfaceInfoBar<InfoBarView>,
                     XamlIsland<InfoBarView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_bar = controls::InfoBar{};
    m_bar.IsOpen(true);
    m_bar.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
    m_bar.CloseButtonClick([weak = get_weak()](const controls::InfoBar &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) {
        if (auto emitter = strong->EventEmitter()) {
          emitter->onClose(Codegen::ExpoInterfaceInfoBarEventEmitter::OnClose{});
        }
      }
    });
    m_action = controls::Button{};
    m_action.Click([weak = get_weak()](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
      if (auto strong = weak.get()) {
        if (auto emitter = strong->EventEmitter()) {
          emitter->onAction(Codegen::ExpoInterfaceInfoBarEventEmitter::OnAction{});
        }
      }
    });
    Attach(islandView, m_bar);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceInfoBarProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceInfoBarProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceInfoBar<InfoBarView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    ApplyLook(Root(), props->theme, props->accentColor);
    m_bar.Message(ToHString(props->message));
    m_bar.IsClosable(props->closable.value_or(true));
    const auto severity = props->severity.value_or("informational");
    m_bar.Severity(
        severity == "success" ? controls::InfoBarSeverity::Success
        : severity == "warning" ? controls::InfoBarSeverity::Warning
        : severity == "error" ? controls::InfoBarSeverity::Error
        : controls::InfoBarSeverity::Informational);
    if (props->actionLabel && !props->actionLabel->empty()) {
      m_action.Content(winrt::box_value(ToHString(*props->actionLabel)));
      m_bar.ActionButton(m_action);
    } else {
      m_bar.ActionButton(nullptr);
    }
    m_bar.IsOpen(true);
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  controls::InfoBar m_bar{nullptr};
  controls::Button m_action{nullptr};
};

// -- NavigationView (tabs) ---------------------------------------------------

/**
 * WinUI's pane widths — `OpenPaneLength` and `CompactPaneLength` — set
 * explicitly because the kit sizes the island to them in left mode: the
 * pane is the whole island, and the content beside it is React Native's.
 */
constexpr double kOpenPaneLength = 320;
constexpr double kCompactPaneLength = 48;

struct NavigationViewView : winrt::implements<NavigationViewView, winrt::IInspectable>,
                            Codegen::BaseExpoInterfaceNavigationView<NavigationViewView>,
                            XamlIsland<NavigationViewView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_view = controls::NavigationView{};
    m_view.PaneDisplayMode(controls::NavigationViewPaneDisplayMode::Top);
    m_view.IsBackButtonVisible(controls::NavigationViewBackButtonVisible::Collapsed);
    m_view.IsSettingsVisible(false);
    m_view.IsPaneToggleButtonVisible(false);
    m_view.IsTitleBarAutoPaddingEnabled(false);
    m_view.OpenPaneLength(kOpenPaneLength);
    m_view.CompactPaneLength(kCompactPaneLength);
    // WinUI's pane fills are for a Mica window: the default one is in-app acrylic, which
    // has no backdrop in an island and paints solid white. The pane is transparent, over
    // the kit's own background, as the top bar already is.
    OverrideBrushes(m_view, {L"NavigationViewDefaultPaneBackground", L"NavigationViewExpandedPaneBackground"}, Color{0, 0, 0, 0});
    // The toggle button flips the pane; the kit hears of it, resizes the island and
    // asks for the other mode. Opening the compact pane is left to WinUI (the kit's
    // switch to the expanded mode keeps it open). Collapsing the expanded pane is
    // not: WinUI's collapse in place leaves the pane empty at the island's width,
    // however the compact mode is applied afterwards, so the collapse is cancelled
    // and the switch to the compact mode closes the pane instead — the transition
    // WinUI's adaptive layout makes when a window narrows.
    m_view.PaneOpening([weak = get_weak()](const controls::NavigationView &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) strong->ReportPaneOpen(true);
    });
    m_view.PaneClosing([weak = get_weak()](const controls::NavigationView &, const controls::NavigationViewPaneClosingEventArgs &args) {
      if (auto strong = weak.get()) {
        if (!strong->m_applying && strong->m_view.PaneDisplayMode() == controls::NavigationViewPaneDisplayMode::Left) {
          args.Cancel(true);
        }
        strong->ReportPaneOpen(false);
      }
    });
    m_view.SelectionChanged([weak = get_weak()](const controls::NavigationView &sender, const controls::NavigationViewSelectionChangedEventArgs &args) {
      if (auto strong = weak.get()) {
        if (strong->m_applying) return;
        auto selected = args.SelectedItem();
        if (!selected) return;
        uint32_t index = 0;
        if (!sender.MenuItems().IndexOf(selected, index)) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceNavigationViewEventEmitter::OnSelectionChange event;
          event.index = static_cast<int32_t>(index);
          emitter->onSelectionChange(std::move(event));
        }
      }
    });
    Attach(islandView, m_view);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceNavigationViewProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceNavigationViewProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceNavigationView<NavigationViewView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    m_applying = true;
    ApplyLook(Root(), props->theme, props->accentColor);
    // The island's root is white where the control is transparent, and the pane is: the kit's background goes behind it.
    Root().as<controls::Panel>().Background(Brush(ColorOr(props->background, Color{0, 0, 0, 0})));
    if (props->items != m_items) {
      m_items = props->items;
      m_view.MenuItems().Clear();
      for (auto value : ParseArray(m_items)) {
        if (value.ValueType() != JsonValueType::Object) continue;
        auto entry = value.GetObject();
        controls::NavigationViewItem item;
        item.Content(winrt::box_value(ToHString(JsonString(entry, L"label"))));
        const auto glyph = JsonString(entry, L"glyph");
        if (!glyph.empty()) item.Icon(MakeGlyph(glyph, 16));
        m_view.MenuItems().Append(item);
      }
    }
    const uint32_t index = static_cast<uint32_t>(std::max(0, props->selectedIndex.value_or(0)));
    if (index < m_view.MenuItems().Size() && m_view.SelectedItem() != m_view.MenuItems().GetAt(index)) {
      m_view.SelectedItem(m_view.MenuItems().GetAt(index));
    }
    m_view.PaneTitle(ToHString(props->header.value_or("")));
    // WinUI's own modes rather than a forced IsPaneOpen (WinUI reopens a forced-closed
    // pane on entering the expanded mode) or its adaptive mode (which closes the pane
    // on the very resize the kit makes to open it): entering the expanded mode opens
    // the pane, entering the compact one closes it.
    const auto mode = props->paneMode.value_or("top");
    m_wanted = mode == "left"      ? controls::NavigationViewPaneDisplayMode::Left
               : mode == "compact" ? controls::NavigationViewPaneDisplayMode::LeftCompact
                                   : controls::NavigationViewPaneDisplayMode::Top;
    // The side pane keeps the control at the open width whatever the island's: the
    // island clips it to the compact strip, as a window shows the strip of a wider
    // control, and the pane's open and close animations never coincide with a resize
    // of the control — which leaves the compact pane empty.
    m_view.MinWidth(mode == "top" ? 0.0 : kOpenPaneLength);
    ApplyDisplayMode();
    m_view.IsPaneToggleButtonVisible(mode != "top");
    m_applying = false;
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  /** Puts the control in the mode the kit asked for; WinUI opens or closes the pane as the mode says. */
  void ApplyDisplayMode() noexcept {
    if (m_view.PaneDisplayMode() != m_wanted) m_view.PaneDisplayMode(m_wanted);
  }

  void ReportPaneOpen(bool open) noexcept {
    if (m_applying) return;
    if (auto emitter = EventEmitter()) {
      Codegen::ExpoInterfaceNavigationViewEventEmitter::OnPaneOpenChange event;
      event.open = open;
      emitter->onPaneOpenChange(std::move(event));
    }
  }

  controls::NavigationView m_view{nullptr};
  std::string m_items;
  controls::NavigationViewPaneDisplayMode m_wanted{controls::NavigationViewPaneDisplayMode::Top};
  bool m_applying{false};
};

} // namespace

void RegisterOverlays(rn::IReactPackageBuilder const &packageBuilder) noexcept {
  RegisterIsland<MenuFlyoutView>(packageBuilder, &Codegen::RegisterExpoInterfaceMenuFlyoutNativeComponent<MenuFlyoutView>);
  RegisterIsland<ContentDialogView>(packageBuilder, &Codegen::RegisterExpoInterfaceContentDialogNativeComponent<ContentDialogView>);
  RegisterIsland<FlyoutView>(packageBuilder, &Codegen::RegisterExpoInterfaceFlyoutNativeComponent<FlyoutView>);
  RegisterIsland<InfoBarView>(packageBuilder, &Codegen::RegisterExpoInterfaceInfoBarNativeComponent<InfoBarView>);
  RegisterIsland<NavigationViewView>(packageBuilder, &Codegen::RegisterExpoInterfaceNavigationViewNativeComponent<NavigationViewView>);
}

} // namespace winrt::ExpoInterface

#else

namespace winrt::ExpoInterface {
void RegisterOverlays(winrt::Microsoft::ReactNative::IReactPackageBuilder const &) noexcept {}
} // namespace winrt::ExpoInterface

#endif // RNW_NEW_ARCH
