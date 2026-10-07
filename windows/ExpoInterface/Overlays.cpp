#include "pch.h"

#include "Overlays.h"
#include "Portal.h"

#ifdef RNW_NEW_ARCH

#include "XamlHost.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceContentDialog.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceCommandBar.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceTeachingTip.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceInfoBar.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceMenuFlyout.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceNavigationView.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceTabView.g.h"

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
        // Closed to move it: open it again at the new place, and say nothing.
        if (strong->m_moving) {
          strong->m_moving = false;
          if (auto props = strong->Props(); props && props->open) {
            strong->Show(props->atPoint.value_or(false), props->x.value_or(0.0), props->y.value_or(0.0), props->edge.value_or("bottom") == "top");
          }
          return;
        }
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
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    if (props->items != m_items) {
      m_items = props->items;
      Build(ParseArray(m_items));
    }
    const bool atPoint = props->atPoint.value_or(false);
    const double x = props->x.value_or(0.0);
    const double y = props->y.value_or(0.0);
    const bool above = props->edge.value_or("bottom") == "top";
    if (props->open && !m_open) {
      if (!m_moving) Show(atPoint, x, y, above);
    } else if (!props->open && m_open) {
      m_flyout.Hide();
    } else if (props->open && m_open && (x != m_x || y != m_y || above != m_above)) {
      // A new anchor while the menu is open: the flyout is closed and opened
      // again there, as one move rather than a close the app hears of.
      m_moving = true;
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
      // The shortcut is drawn as WinUI draws an accelerator; the kit binds the keys itself.
      const auto shortcut = JsonString(entry, L"shortcut");
      if (!shortcut.empty()) item.KeyboardAcceleratorTextOverride(ToHString(shortcut));
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

  void Show(bool atPoint, double x, double y, bool above) noexcept {
    if (!m_anchor.XamlRoot()) {
      // Not in the tree yet: shown once it is.
      m_anchor.Loaded([weak = get_weak(), atPoint, x, y, above](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
        if (auto strong = weak.get()) {
          if (auto props = strong->Props(); props && props->open && !strong->m_open) strong->Show(atPoint, x, y, above);
        }
      });
      return;
    }
    m_open = true;
    m_x = x;
    m_y = y;
    m_above = above;
    controls::Primitives::FlyoutShowOptions options;
    if (atPoint) {
      options.Position(winrt::Windows::Foundation::Point{static_cast<float>(x), static_cast<float>(y)});
      options.Placement(above ? controls::Primitives::FlyoutPlacementMode::TopEdgeAlignedLeft : controls::Primitives::FlyoutPlacementMode::BottomEdgeAlignedLeft);
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
  // Where the open menu was placed, and whether it is being moved.
  double m_x{0.0};
  double m_y{0.0};
  bool m_above{false};
  bool m_moving{false};
};

// -- ContentDialog -----------------------------------------------------------

/**
 * A modal dialog over the whole window. WinUI's `ContentDialog` covers its
 * XamlRoot, and an island's XamlRoot is the island itself, so the dialog is
 * a windowed popup sized to the app window instead: a smoke layer and a card
 * in ContentDialog's arrangement, the title and the message in the body, a
 * slot for a React Native body below them (through the kit's portal), the
 * first two actions across the bottom as the primary and secondary buttons,
 * the cancel action as the close button, any more in the body.
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
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
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
    // An island opened on its first props is connected but not placed yet:
    // the window cannot be found from it and its root has no size. A moment
    // later it has both.
    if (width <= 0 || height <= 0) {
      if (m_retries++ < 20) {
        m_retry = winrt::Microsoft::UI::Dispatching::DispatcherQueue::GetForCurrentThread().CreateTimer();
        m_retry.Interval(std::chrono::milliseconds(50));
        m_retry.IsRepeating(false);
        m_retry.Tick([weak = get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
          if (auto strong = weak.get()) {
            if (auto props = strong->Props(); props && props->open && !strong->m_popup) strong->Show();
          }
        });
        m_retry.Start();
      }
      return;
    }
    m_retries = 0;

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
    if (!props->title.empty()) {
      controls::TextBlock title;
      title.Text(ToHString(props->title));
      title.FontSize(20);
      title.FontWeight(winrt::Microsoft::UI::Text::FontWeights::SemiBold());
      title.TextWrapping(xaml::TextWrapping::Wrap);
      body.Children().Append(title);
    }
    if (props->message && !props->message->empty()) {
      controls::TextBlock message;
      message.Text(ToHString(*props->message));
      message.TextWrapping(xaml::TextWrapping::Wrap);
      if (body.Children().Size() > 0) message.Margin({0, 12, 0, 0});
      body.Children().Append(message);
    }
    // A React Native body, through a portal naming the slot. It lays out in
    // the slot's width and, past the slot's height, scrolls inside it.
    const bool hasSlot = props->slot && !props->slot->empty();
    if (hasSlot) {
      controls::Grid slot;
      slot.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
      slot.MinHeight(8);
      slot.MaxHeight(std::max(120.0, height * 0.9 - 200.0));
      if (body.Children().Size() > 0) slot.Margin({0, 12, 0, 0});
      body.Children().Append(slot);
      m_slotName = *props->slot;
      RegisterSlot(m_slotName, slot);
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

    // The card centered on a smoke layer the size of the window.
    auto escape = [weak = get_weak()](const winrt::IInspectable &, const xaml::Input::KeyRoutedEventArgs &args) {
      if (args.Key() != winrt::Windows::System::VirtualKey::Escape) return;
      if (auto strong = weak.get()) {
        args.Handled(true);
        strong->Close(strong->m_cancel);
      }
    };
    controls::StackPanel column;
    column.Children().Append(body);
    if (row.Children().Size() > 0) column.Children().Append(row);
    controls::Border card;
    card.Child(column);
    // A React body wants a definite width to lay out in; XAML's own takes its content's.
    if (hasSlot) {
      card.Width(std::min(548.0, width - 48.0));
    } else {
      card.MinWidth(320);
      card.MaxWidth(548);
    }
    card.Background(Brush(base));
    card.BorderBrush(Brush(stroke));
    card.BorderThickness({1, 1, 1, 1});
    card.CornerRadius({8, 8, 8, 8});
    card.RequestedTheme(Root().RequestedTheme());
    card.KeyDown(escape);
    controls::Grid smoke;
    smoke.Width(width);
    smoke.Height(height);
    smoke.Background(Brush(Color{77, 0, 0, 0}));
    smoke.RequestedTheme(Root().RequestedTheme());
    smoke.KeyDown(escape);
    if (props->lightDismiss.value_or(false)) {
      smoke.Tapped([weak = get_weak()](const winrt::IInspectable &, const xaml::Input::TappedRoutedEventArgs &) {
        if (auto strong = weak.get()) strong->Close(strong->m_cancel);
      });
    }

    auto makePopup = [&root](const xaml::UIElement &child) {
      controls::Primitives::Popup popup;
      popup.XamlRoot(root);
      popup.ShouldConstrainToRootBounds(false);
      popup.IsLightDismissEnabled(false);
      popup.Child(child);
      return popup;
    };
    // The card centered in the smoke, one windowed popup.
    card.HorizontalAlignment(xaml::HorizontalAlignment::Center);
    card.VerticalAlignment(xaml::VerticalAlignment::Center);
    smoke.Children().Append(card);
    auto popup = makePopup(smoke);
    popup.HorizontalOffset(offsetX);
    popup.VerticalOffset(offsetY);
    popup.Closed([weak = get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) strong->OnClosed();
    });
    m_popup = popup;
    try {
      popup.IsOpen(true);
    } catch (const winrt::hresult_error &) {
      m_popup = nullptr;
      return;
    }
    if (first) {
      first.Focus(xaml::FocusState::Programmatic);
    } else if (hasSlot) {
      // No button of its own: the keyboard goes to the React body, through the
      // portal's tab stop in the slot, once the portal has put it there.
      m_focus = winrt::Microsoft::UI::Dispatching::DispatcherQueue::GetForCurrentThread().CreateTimer();
      m_focus.Interval(std::chrono::milliseconds(150));
      m_focus.IsRepeating(false);
      m_focus.Tick([weak = get_weak(), card](const winrt::IInspectable &, const winrt::IInspectable &) {
        if (auto strong = weak.get(); strong && strong->m_popup) {
          if (auto element = xaml::Input::FocusManager::FindFirstFocusableElement(card).try_as<xaml::UIElement>()) element.Focus(xaml::FocusState::Programmatic);
        }
      });
      m_focus.Start();
    }
  }

  void Close(int32_t picked) noexcept {
    if (!m_popup) return;
    m_picked = picked;
    m_popup.IsOpen(false);
  }

  void OnClosed() noexcept {
    if (!m_popup) return;
    m_popup = nullptr;
    if (!m_slotName.empty()) {
      UnregisterSlot(m_slotName);
      m_slotName.clear();
    }
    const int32_t picked = m_picked < 0 ? m_cancel : m_picked;
    if (auto emitter = EventEmitter()) {
      Codegen::ExpoInterfaceContentDialogEventEmitter::OnClose event;
      event.index = picked;
      emitter->onClose(std::move(event));
    }
  }

  controls::Grid m_anchor{nullptr};
  controls::Primitives::Popup m_popup{nullptr};
  winrt::Microsoft::UI::Dispatching::DispatcherQueueTimer m_retry{nullptr};
  winrt::Microsoft::UI::Dispatching::DispatcherQueueTimer m_focus{nullptr};
  int m_retries{0};
  std::string m_slotName;
  int32_t m_cancel{-1};
  int32_t m_picked{-1};
};

// -- CommandBar (toolbar) ----------------------------------------------------

/**
 * The Windows toolbar. A `CommandBar` builds its own buttons from the
 * commands it is given, works out which of them fit the width it has, and
 * moves the rest into an overflow menu it draws itself — none of which it can
 * do for a bar handed React children, which is why the commands cross as data.
 */
struct CommandBarView : winrt::implements<CommandBarView, winrt::IInspectable>,
                        Codegen::BaseExpoInterfaceCommandBar<CommandBarView>,
                        XamlIsland<CommandBarView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_bar = controls::CommandBar{};
    // The bar fills the island, which the kit has sized to the row it sits in.
    m_bar.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
    m_bar.DefaultLabelPosition(controls::CommandBarDefaultLabelPosition::Bottom);
    Attach(islandView, m_bar);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceCommandBarProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceCommandBarProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceCommandBar<CommandBarView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    m_bar.DefaultLabelPosition(LabelPositionFrom(props->labels.value_or("bottom")));
    Build();
    Remeasure();
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  static controls::CommandBarDefaultLabelPosition LabelPositionFrom(const std::string &labels) noexcept {
    if (labels == "right") return controls::CommandBarDefaultLabelPosition::Right;
    if (labels == "collapsed") return controls::CommandBarDefaultLabelPosition::Collapsed;
    return controls::CommandBarDefaultLabelPosition::Bottom;
  }

  void Build() noexcept {
    auto props = Props();
    if (!props) return;
    const bool dark = IsDark(Root());
    m_bar.PrimaryCommands().Clear();
    m_bar.SecondaryCommands().Clear();
    auto commands = ParseArray(props->commands);
    int32_t index = 0;
    for (auto value : commands) {
      const int32_t current = index++;
      if (value.ValueType() != JsonValueType::Object) continue;
      auto entry = value.GetObject();
      const bool secondary = JsonBool(entry, L"secondary");
      if (JsonBool(entry, L"separator")) {
        controls::AppBarSeparator separator;
        if (secondary) {
          m_bar.SecondaryCommands().Append(separator);
        } else {
          m_bar.PrimaryCommands().Append(separator);
        }
      }
      // A command with an on state is the bar's own toggle button, which
      // Narrator reads as on or off; the others are plain buttons.
      if (JsonBool(entry, L"toggle")) {
        controls::AppBarToggleButton toggle;
        toggle.IsChecked(JsonBool(entry, L"checked"));
        Dress(toggle, entry, current, dark);
        Append(toggle, secondary);
      } else {
        controls::AppBarButton button;
        Dress(button, entry, current, dark);
        Append(button, secondary);
      }
    }
  }

  /** The label, glyph, state and press every command takes, a toggle or not. */
  template <typename T>
  void Dress(T &button, const JsonObject &entry, int32_t current, bool dark) noexcept {
    button.Label(ToHString(JsonString(entry, L"label")));
    const auto glyph = JsonString(entry, L"glyph");
    if (!glyph.empty()) button.Icon(MakeGlyph(glyph, 16));
    button.IsEnabled(!JsonBool(entry, L"disabled"));
    if (JsonString(entry, L"role") == "destructive") {
      button.Foreground(Brush(Critical(dark)));
    }
    // The label is the accessible name: an icon-only command in a collapsed
    // bar names nothing otherwise.
    SetName(button, std::optional<std::string>{JsonString(entry, L"label")});
    button.Click([weak = get_weak(), current](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
      if (auto strong = weak.get()) {
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceCommandBarEventEmitter::OnPress event;
          event.index = current;
          emitter->onPress(std::move(event));
        }
      }
    });
  }

  void Append(const controls::ICommandBarElement &element, bool secondary) noexcept {
    if (secondary) {
      m_bar.SecondaryCommands().Append(element);
    } else {
      m_bar.PrimaryCommands().Append(element);
    }
  }

  controls::CommandBar m_bar{nullptr};
};

// -- TeachingTip (popover) ---------------------------------------------------

/**
 * The Windows popover. A `TeachingTip` rather than a `Flyout`: it is the
 * control this component has always described, with a tail that points at its
 * target and a title and subtitle of its own rather than text blocks built by
 * hand. The tip lives in the island beside the anchor the kit lays over the
 * rectangle, and points at it.
 */
struct TeachingTipView : winrt::implements<TeachingTipView, winrt::IInspectable>,
                         Codegen::BaseExpoInterfaceTeachingTip<TeachingTipView>,
                         XamlIsland<TeachingTipView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_anchor = MakeAnchor();
    m_tip = controls::TeachingTip{};
    m_tip.IsLightDismissEnabled(true);
    // A TeachingTip is a control in the tree, not a flyout that opens its own
    // window, and by default it is confined to the bounds of its XamlRoot —
    // which here is an island sized to the rectangle being pointed at, a few
    // points across. Confined to that it is clipped away to nothing. Letting
    // it out of those bounds puts it in a window of its own, which is how the
    // Flyout this replaced behaved and what a popover needs.
    m_tip.ShouldConstrainToRootBounds(false);
    // The tip points at the anchor, which the kit has laid over the rectangle
    // the popover is about.
    m_tip.Target(m_anchor);
    m_tip.Closed([weak = get_weak()](const winrt::IInspectable &, const controls::TeachingTipClosedEventArgs &) {
      if (auto strong = weak.get()) {
        strong->m_open = false;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceTeachingTipEventEmitter::OnOpenChange event;
          event.open = false;
          emitter->onOpenChange(std::move(event));
        }
      }
    });
    // A tip is a control in the tree, not something shown at a point, so the
    // island holds both it and the anchor it points at.
    m_root = controls::Grid{};
    m_root.Children().Append(m_anchor);
    m_root.Children().Append(m_tip);
    Attach(islandView, m_root);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceTeachingTipProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceTeachingTipProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceTeachingTip<TeachingTipView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    Build();
    if (props->open && !m_open) {
      Show();
    } else if (!props->open && m_open) {
      m_tip.IsOpen(false);
    }
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  /** The side the tip prefers; it still moves when there is no room there. */
  static controls::TeachingTipPlacementMode PlacementFrom(const std::string &edge) noexcept {
    if (edge == "top") return controls::TeachingTipPlacementMode::Top;
    if (edge == "bottom") return controls::TeachingTipPlacementMode::Bottom;
    return controls::TeachingTipPlacementMode::Auto;
  }

  void Build() noexcept {
    auto props = Props();
    if (!props) return;
    const bool dark = IsDark(Root());
    // The title and the message are the tip's own properties, so they take
    // Fluent's type ramp rather than a pair of text blocks guessing at it.
    m_tip.Title(ToHString(props->title.value_or("")));
    m_tip.Subtitle(ToHString(props->message.value_or("")));
    m_tip.PreferredPlacement(PlacementFrom(props->preferredEdge.value_or("auto")));

    controls::StackPanel content;
    content.Width(props->width);
    content.Spacing(4);
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
              Codegen::ExpoInterfaceTeachingTipEventEmitter::OnAction event;
              event.index = current;
              emitter->onAction(std::move(event));
            }
            strong->m_tip.IsOpen(false);
          }
        });
        row.Children().Append(button);
      }
      content.Children().Append(row);
    }
    // The actions stay a row in the content rather than becoming the tip's own
    // action and close buttons: a TeachingTip has exactly one of each, and a
    // popover may carry any number.
    m_tip.Content(content.Children().Size() > 0 ? content : nullptr);
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
    m_tip.IsOpen(true);
    if (auto emitter = EventEmitter()) {
      Codegen::ExpoInterfaceTeachingTipEventEmitter::OnOpenChange event;
      event.open = true;
      emitter->onOpenChange(std::move(event));
    }
  }

  controls::Grid m_root{nullptr};
  controls::Grid m_anchor{nullptr};
  controls::TeachingTip m_tip{nullptr};
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
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
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
/** How long, in milliseconds, the island's growth to the pane's width may take before a light dismiss of the pane counts again. */
constexpr uint64_t kGrowthWindow = 1000;

/** The first element of a name under `root` in the visual tree: a part of a control's template, once the template is applied. */
static xaml::FrameworkElement FindDescendant(const xaml::DependencyObject &root, const wchar_t *name) noexcept {
  const auto count = xaml::Media::VisualTreeHelper::GetChildrenCount(root);
  for (int32_t index = 0; index < count; ++index) {
    auto child = xaml::Media::VisualTreeHelper::GetChild(root, index);
    if (auto element = child.try_as<xaml::FrameworkElement>(); element && element.Name() == name) return element;
    if (auto found = FindDescendant(child, name)) return found;
  }
  return nullptr;
}

struct NavigationViewView : winrt::implements<NavigationViewView, winrt::IInspectable>,
                            Codegen::BaseExpoInterfaceNavigationView<NavigationViewView>,
                            XamlIsland<NavigationViewView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_view = controls::NavigationView{};
    m_view.PaneDisplayMode(controls::NavigationViewPaneDisplayMode::Top);
    m_view.IsBackButtonVisible(controls::NavigationViewBackButtonVisible::Collapsed);
    m_view.IsBackEnabled(false);
    m_view.IsSettingsVisible(false);
    m_view.IsPaneToggleButtonVisible(false);
    m_view.IsTitleBarAutoPaddingEnabled(false);
    m_view.OpenPaneLength(kOpenPaneLength);
    m_view.CompactPaneLength(kCompactPaneLength);
    // WinUI's pane fills are for a Mica window: the default one is in-app acrylic, which
    // has no backdrop in an island and paints solid white. The pane is transparent, over
    // the kit's own background, as the top bar already is. So is the control's own
    // content area, whose layer fill and top border would otherwise show behind the
    // minimal pane's toggle row, the one place the island shows any of it.
    OverrideBrushes(m_view, {L"NavigationViewDefaultPaneBackground", L"NavigationViewExpandedPaneBackground", L"NavigationViewContentBackground", L"NavigationViewContentGridBorderBrush"}, Color{0, 0, 0, 0});
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
    // The pane is open: whatever growth the island made for it is over.
    m_view.PaneOpened([weak = get_weak()](const controls::NavigationView &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) strong->SettleGrowth();
    });
    // The minimal pane's island is its toggle row alone while the pane is closed: the
    // row's size is reported as the row is laid out, since WinUI arranges the back
    // button beside the toggle in that mode and the row grows when the button appears.
    m_view.LayoutUpdated([weak = get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) {
        if (strong->m_minimalClosed) strong->ReportDesiredSize({});
      }
    });
    m_view.PaneClosing([weak = get_weak()](const controls::NavigationView &, const controls::NavigationViewPaneClosingEventArgs &args) {
      if (auto strong = weak.get()) {
        // An overlay pane is light-dismissed by WinUI when its XAML root changes size,
        // and the island is that root: the kit's own growth of the island to the
        // pane's width, on the pane's opening, would close what it opens. That one
        // closing is refused; the pane goes on opening in the room it now has.
        if (!strong->m_applying && strong->m_growing && GetTickCount64() - strong->m_growSince < kGrowthWindow) {
          args.Cancel(true);
          return;
        }
        if (!strong->m_applying && strong->m_view.PaneDisplayMode() == controls::NavigationViewPaneDisplayMode::Left) {
          args.Cancel(true);
        }
        strong->ReportPaneOpen(false);
      }
    });
    m_view.SelectionChanged([weak = get_weak()](const controls::NavigationView &sender, const controls::NavigationViewSelectionChangedEventArgs &args) {
      if (auto strong = weak.get()) {
        if (strong->m_applying) return;
        // Each item is tagged with its route's index; the settings item is the settings route's.
        int32_t index = -1;
        if (args.IsSettingsSelected()) {
          index = strong->m_settingsIndex;
        } else if (auto item = args.SelectedItem().try_as<controls::NavigationViewItem>()) {
          index = winrt::unbox_value_or<int32_t>(item.Tag(), -1);
        }
        if (index < 0) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceNavigationViewEventEmitter::OnSelectionChange event;
          event.index = index;
          emitter->onSelectionChange(std::move(event));
        }
      }
    });
    // Every press on an item, the selected one included: a press on the current section
    // returns to its root, as the Settings app does, which SelectionChanged cannot say.
    m_view.ItemInvoked([weak = get_weak()](const controls::NavigationView &, const controls::NavigationViewItemInvokedEventArgs &args) {
      if (auto strong = weak.get()) {
        int32_t index = -1;
        if (args.IsSettingsInvoked()) {
          index = strong->m_settingsIndex;
        } else if (auto item = args.InvokedItemContainer().try_as<controls::NavigationViewItem>()) {
          index = winrt::unbox_value_or<int32_t>(item.Tag(), -1);
        }
        if (index < 0) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceNavigationViewEventEmitter::OnItemInvoked event;
          event.index = index;
          emitter->onItemInvoked(std::move(event));
        }
      }
    });
    // The control's own back button: the press is the kit's to act on, as WinUI leaves the
    // back stack to the app (a compact pane open as a flyout closes on it instead, by WinUI).
    m_view.BackRequested([weak = get_weak()](const controls::NavigationView &, const controls::NavigationViewBackRequestedEventArgs &) {
      if (auto strong = weak.get()) {
        if (auto emitter = strong->EventEmitter()) {
          emitter->onBackRequested(Codegen::ExpoInterfaceNavigationViewEventEmitter::OnBackRequested{});
        }
      }
    });
    // The settings item exists once the template is applied: a selection of it asked for before is made then.
    m_view.Loaded([weak = get_weak()](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
      if (auto strong = weak.get()) {
        strong->m_applying = true;
        strong->SelectRoute(strong->m_selected);
        strong->m_applying = false;
        // The XAML root is the island: its change of size is what light-dismisses an open
        // overlay pane, so the growth to the pane's width is over once the root has it.
        strong->m_view.XamlRoot().Changed([weak](const xaml::XamlRoot &root, const xaml::XamlRootChangedEventArgs &) {
          if (auto self = weak.get()) self->SettleGrowth();
        });
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
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    // The island's root is white where the control is transparent, and the pane is: the kit's background goes behind it.
    Root().as<controls::Panel>().Background(Brush(ColorOr(props->background, Color{0, 0, 0, 0})));
    if (props->items != m_items) {
      m_items = props->items;
      m_view.MenuItems().Clear();
      m_view.FooterMenuItems().Clear();
      m_settingsIndex = -1;
      int32_t index = 0;
      for (auto value : ParseArray(m_items)) {
        if (value.ValueType() != JsonValueType::Object) {
          ++index;
          continue;
        }
        auto entry = value.GetObject();
        // The settings route takes WinUI's own settings item, at the pane's foot, with its gear and its name.
        const auto placement = JsonString(entry, L"placement");
        if (placement == "settings") {
          m_settingsIndex = index++;
          continue;
        }
        controls::NavigationViewItem item;
        item.Content(winrt::box_value(ToHString(JsonString(entry, L"label"))));
        const auto glyph = JsonString(entry, L"glyph");
        if (!glyph.empty()) item.Icon(MakeGlyph(glyph, 16));
        item.Tag(winrt::box_value(index));
        // A count is drawn in an InfoBadge; any other badge is its dot, which it draws without a value.
        if (entry.HasKey(L"badge")) {
          controls::InfoBadge badge;
          const auto value = entry.Lookup(L"badge");
          if (value.ValueType() == JsonValueType::Number) badge.Value(static_cast<int32_t>(value.GetNumber()));
          item.InfoBadge(badge);
        }
        (placement == "footer" ? m_view.FooterMenuItems() : m_view.MenuItems()).Append(item);
        ++index;
      }
      m_view.IsSettingsVisible(m_settingsIndex >= 0);
    }
    m_selected = std::max(0, props->selectedIndex.value_or(0));
    SelectRoute(m_selected);
    m_view.PaneTitle(ToHString(props->header.value_or("")));
    const auto back = props->backButton.value_or("hidden");
    m_view.IsBackButtonVisible(back == "hidden" ? controls::NavigationViewBackButtonVisible::Collapsed
                                                : controls::NavigationViewBackButtonVisible::Visible);
    m_view.IsBackEnabled(back == "enabled");
    // WinUI's own modes rather than a forced IsPaneOpen (WinUI reopens a forced-closed
    // pane on entering the expanded mode) or its adaptive mode (which closes the pane
    // on the very resize the kit makes to open it): entering the expanded mode opens
    // the pane, entering the compact one closes it.
    const auto mode = props->paneMode.value_or("top");
    m_wanted = mode == "left"      ? controls::NavigationViewPaneDisplayMode::Left
               : mode == "compact" ? controls::NavigationViewPaneDisplayMode::LeftCompact
               : mode == "minimal" ? controls::NavigationViewPaneDisplayMode::LeftMinimal
                                   : controls::NavigationViewPaneDisplayMode::Top;
    // The side pane keeps the control at the open width whatever the island's: the
    // island clips it to the compact strip, as a window shows the strip of a wider
    // control, and the pane's open and close animations never coincide with a resize
    // of the control — which leaves the compact pane empty. The minimal pane's control
    // is kept at the content's height too, since its island is the toggle row alone
    // until the pane opens over the content.
    m_view.MinWidth(mode == "top" ? 0.0 : kOpenPaneLength);
    m_view.MinHeight(mode == "minimal" ? std::max(0.0, props->paneHeight.value_or(0.0)) : 0.0);
    ApplyDisplayMode();
    // In the overlay modes the pane opens and closes inside the island by IsPaneOpen —
    // WinUI's toggle button flips it, the kit's smoke closes it — so a change in what
    // the kit says is applied; the same value again is not, or a press on the toggle
    // button whose report is still on its way to the kit would be undone.
    const bool overlay = m_wanted == controls::NavigationViewPaneDisplayMode::LeftCompact ||
                         m_wanted == controls::NavigationViewPaneDisplayMode::LeftMinimal;
    if (overlay && props->paneOpen.has_value() && (!oldProps || oldProps->paneOpen != props->paneOpen)) {
      if (m_view.IsPaneOpen() != *props->paneOpen) m_view.IsPaneOpen(*props->paneOpen);
    }
    // The kit widens the island to the pane's width once the pane opens: while that growth is on its way, WinUI's light dismiss of the pane is refused.
    if (overlay && props->paneOpen.value_or(false) && Root().ActualWidth() < kOpenPaneLength) {
      if (!m_growing) m_growSince = GetTickCount64();
      m_growing = true;
    }
    m_minimalClosed = m_wanted == controls::NavigationViewPaneDisplayMode::LeftMinimal && !props->paneOpen.value_or(false);
    if (m_minimalClosed) ReportDesiredSize({});
    m_view.IsPaneToggleButtonVisible(mode != "top");
    m_applying = false;
  }

  /**
   * What the island wants from Yoga: the size its content measured, except
   * for the minimal pane while it is closed, where the island is the toggle
   * row alone — the control itself is the pane's whole width and the
   * content's height, and the island shows its top corner.
   */
  void ReportDesiredSize(Size size) noexcept {
    if (m_minimalClosed) {
      if (!m_toggleRow) m_toggleRow = FindDescendant(m_view, L"PaneToggleButtonGrid");
      size = {static_cast<float>(kCompactPaneLength), static_cast<float>(kCompactPaneLength)};
      if (m_toggleRow && m_toggleRow.ActualWidth() > 0 && m_toggleRow.ActualHeight() > 0) {
        size = {static_cast<float>(m_toggleRow.ActualWidth()), static_cast<float>(m_toggleRow.ActualHeight())};
      }
    }
    XamlIsland<NavigationViewView>::ReportDesiredSize(size);
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  /** Puts the control in the mode the kit asked for; WinUI opens or closes the pane as the mode says. */
  void ApplyDisplayMode() noexcept {
    if (m_view.PaneDisplayMode() != m_wanted) m_view.PaneDisplayMode(m_wanted);
  }

  /**
   * Once the island has grown to the pane's width, the growth is over — a
   * turn after the root reports its new size, since the light dismiss that
   * size triggers is delivered in the same turn and must still be refused.
   */
  void SettleGrowth() noexcept {
    if (!m_growing || Root().ActualWidth() < kOpenPaneLength) return;
    m_view.DispatcherQueue().TryEnqueue([weak = get_weak()]() {
      if (auto strong = weak.get()) strong->m_growing = false;
    });
  }

  void ReportPaneOpen(bool open) noexcept {
    if (m_applying) return;
    if (auto emitter = EventEmitter()) {
      Codegen::ExpoInterfaceNavigationViewEventEmitter::OnPaneOpenChange event;
      event.open = open;
      emitter->onPaneOpenChange(std::move(event));
    }
  }

  /** Selects the item tagged with a route's index — the settings item for the settings route — unless it is selected already. */
  void SelectRoute(int32_t index) noexcept {
    winrt::IInspectable wanted{nullptr};
    if (index == m_settingsIndex) {
      wanted = m_view.SettingsItem();
    } else {
      for (const auto &items : {m_view.MenuItems(), m_view.FooterMenuItems()}) {
        for (const auto &entry : items) {
          auto item = entry.try_as<controls::NavigationViewItem>();
          if (item && winrt::unbox_value_or<int32_t>(item.Tag(), -1) == index) wanted = item;
        }
      }
    }
    if (wanted && m_view.SelectedItem() != wanted) m_view.SelectedItem(wanted);
  }

  controls::NavigationView m_view{nullptr};
  /** The template's `PaneToggleButtonGrid`: the toggle row the minimal pane's island is sized to while closed. */
  xaml::FrameworkElement m_toggleRow{nullptr};
  std::string m_items;
  int32_t m_settingsIndex{-1};
  int32_t m_selected{0};
  controls::NavigationViewPaneDisplayMode m_wanted{controls::NavigationViewPaneDisplayMode::Top};
  bool m_applying{false};
  bool m_minimalClosed{false};
  /** The island is growing to the pane's width for a pane that has just opened, and since when. */
  bool m_growing{false};
  uint64_t m_growSince{0};
};

// -- TabView (document tabs) -------------------------------------------------

/**
 * WinUI's `TabView`, as the strip alone.
 *
 * The items carry no content: an island holds XAML and the pages here are
 * React Native's, which the kit draws under the island instead (a portal
 * connects inside an island but draws nothing on react-native-windows 0.84).
 * A `TabViewItem` with nothing in it is
 * still the control's own tab — Narrator reads it as one, the close cross is
 * the control's, and the add button is where Fluent puts it.
 *
 * Reordering is off. Dragging a tab would move it here while the kit's array
 * stayed as it was, and the next render would put it back; a strip that
 * quietly undoes a drag is worse than one that never offered it. It comes back
 * with an `onReorder` to answer with.
 */
struct TabViewView : winrt::implements<TabViewView, winrt::IInspectable>,
                     Codegen::BaseExpoInterfaceTabView<TabViewView>,
                     XamlIsland<TabViewView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_view = controls::TabView{};
    m_view.TabWidthMode(controls::TabViewWidthMode::Equal);
    m_view.CanReorderTabs(false);
    m_view.CanDragTabs(false);
    m_view.IsAddTabButtonVisible(false);
    m_view.VerticalAlignment(xaml::VerticalAlignment::Top);
    // The control's own fill is in-app acrylic, which has no backdrop in an
    // island and paints solid white; the kit's background goes behind it.
    OverrideBrushes(m_view, {L"TabViewBackground", L"TabViewItemHeaderBackground"}, Color{0, 0, 0, 0});
    m_view.SelectionChanged([weak = get_weak()](const winrt::IInspectable &, const controls::SelectionChangedEventArgs &) {
      if (auto strong = weak.get()) {
        if (strong->m_applying) return;
        const auto index = strong->m_view.SelectedIndex();
        if (index < 0) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceTabViewEventEmitter::OnSelectionChange event;
          event.index = index;
          emitter->onSelectionChange(std::move(event));
        }
      }
    });
    // The kit owns the list, so the close is reported and nothing is removed
    // here: the control would otherwise drop a tab the next render puts back.
    m_view.TabCloseRequested([weak = get_weak()](
                                 const controls::TabView &sender,
                                 const controls::TabViewTabCloseRequestedEventArgs &args) {
      if (auto strong = weak.get()) {
        uint32_t index = 0;
        if (!sender.TabItems().IndexOf(args.Tab(), index)) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceTabViewEventEmitter::OnTabClose event;
          event.index = static_cast<int32_t>(index);
          emitter->onTabClose(std::move(event));
        }
      }
    });
    m_view.AddTabButtonClick([weak = get_weak()](const controls::TabView &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) {
        if (auto emitter = strong->EventEmitter()) {
          emitter->onAddTab(Codegen::ExpoInterfaceTabViewEventEmitter::OnAddTab{});
        }
      }
    });
    Attach(islandView, m_view);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceTabViewProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceTabViewProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceTabView<TabViewView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    m_applying = true;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    // The island names its own control: the React view's `accessibilityLabel`
    // never reaches the XAML one, and an unnamed tab control is what Narrator
    // would read out.
    SetName(m_view, props->label);
    Root().as<controls::Panel>().Background(Brush(ColorOr(props->background, Color{0, 0, 0, 0})));
    if (props->items != m_items) {
      m_items = props->items;
      m_view.TabItems().Clear();
      for (auto value : ParseArray(m_items)) {
        if (value.ValueType() != JsonValueType::Object) continue;
        auto entry = value.GetObject();
        controls::TabViewItem item;
        item.Header(winrt::box_value(ToHString(JsonString(entry, L"title"))));
        const auto glyph = JsonString(entry, L"glyph");
        if (!glyph.empty()) {
          controls::FontIconSource icon;
          icon.FontFamily(media::FontFamily{L"Segoe Fluent Icons,Segoe MDL2 Assets"});
          icon.Glyph(GlyphFromCodePoint(glyph));
          icon.FontSize(16);
          item.IconSource(icon);
        }
        item.IsClosable(entry.GetNamedBoolean(L"closable", false));
        // A nested tab sits further in, by its depth.
        const auto depth = entry.GetNamedNumber(L"depth", 0);
        if (depth > 0) item.Margin(xaml::Thickness{depth * 12, 0, 0, 0});
        // A tab with a menu reports the right click and the Menu key with the
        // point, in the island's coordinates, for the kit's menu to open at.
        if (entry.GetNamedBoolean(L"menu", false)) {
          item.RightTapped([weak = get_weak()](const winrt::IInspectable &sender, const xaml::Input::RightTappedRoutedEventArgs &args) {
            if (auto strong = weak.get()) strong->TabMenu(sender.as<controls::TabViewItem>(), args.GetPosition(strong->Root()));
          });
          item.ContextRequested([weak = get_weak()](const xaml::UIElement &sender, const xaml::Input::ContextRequestedEventArgs &args) {
            if (auto strong = weak.get()) {
              winrt::Windows::Foundation::Point point{0, 0};
              if (!args.TryGetPosition(strong->Root(), point)) {
                // The Menu key reports no point: the tab's own bottom corner.
                const auto transform = sender.TransformToVisual(strong->Root());
                const auto size = sender.as<xaml::FrameworkElement>().ActualSize();
                point = transform.TransformPoint(winrt::Windows::Foundation::Point{0, size.y});
              }
              strong->TabMenu(sender.as<controls::TabViewItem>(), point);
              args.Handled(true);
            }
          });
        }
        m_view.TabItems().Append(item);
      }
    }
    const auto count = static_cast<int32_t>(m_view.TabItems().Size());
    const auto selected = std::clamp(props->selectedIndex.value_or(0), 0, std::max(0, count - 1));
    if (count > 0 && m_view.SelectedIndex() != selected) m_view.SelectedIndex(selected);
    m_view.IsAddTabButtonVisible(props->addButton.value_or(false));
    m_applying = false;
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  void TabMenu(const controls::TabViewItem &item, const winrt::Windows::Foundation::Point &point) noexcept {
    uint32_t index = 0;
    if (!m_view.TabItems().IndexOf(item, index)) return;
    if (auto emitter = EventEmitter()) {
      Codegen::ExpoInterfaceTabViewEventEmitter::OnTabMenu event;
      event.index = static_cast<int32_t>(index);
      event.x = point.X;
      event.y = point.Y;
      emitter->onTabMenu(std::move(event));
    }
  }

  controls::TabView m_view{nullptr};
  std::string m_items;
  bool m_applying{false};
};

} // namespace

void RegisterOverlays(rn::IReactPackageBuilder const &packageBuilder) noexcept {
  RegisterIsland<MenuFlyoutView>(packageBuilder, &Codegen::RegisterExpoInterfaceMenuFlyoutNativeComponent<MenuFlyoutView>);
  RegisterIsland<ContentDialogView>(packageBuilder, &Codegen::RegisterExpoInterfaceContentDialogNativeComponent<ContentDialogView>);
  RegisterIsland<TeachingTipView>(packageBuilder, &Codegen::RegisterExpoInterfaceTeachingTipNativeComponent<TeachingTipView>);
  RegisterIsland<CommandBarView>(packageBuilder, &Codegen::RegisterExpoInterfaceCommandBarNativeComponent<CommandBarView>);
  RegisterIsland<InfoBarView>(packageBuilder, &Codegen::RegisterExpoInterfaceInfoBarNativeComponent<InfoBarView>);
  RegisterIsland<NavigationViewView>(packageBuilder, &Codegen::RegisterExpoInterfaceNavigationViewNativeComponent<NavigationViewView>);
  RegisterIsland<TabViewView>(packageBuilder, &Codegen::RegisterExpoInterfaceTabViewNativeComponent<TabViewView>);
}

} // namespace winrt::ExpoInterface

#else

namespace winrt::ExpoInterface {
void RegisterOverlays(winrt::Microsoft::ReactNative::IReactPackageBuilder const &) noexcept {}
} // namespace winrt::ExpoInterface

#endif // RNW_NEW_ARCH
