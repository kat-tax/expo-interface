#include "pch.h"

#include "Portal.h"

#ifdef RNW_NEW_ARCH

#include <map>

#include "Backdrop.h"
#include "XamlHost.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceExpander.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceMaterial.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfacePortal.g.h"

/**
 * React Native content inside a XAML control.
 *
 * A hosting island registers a named slot: the XAML element its React content
 * goes into, the element WinUI clips its own content to, and whether its
 * content area is at rest or animating open or shut. `ExpoInterfacePortal` is
 * a react-native-windows portal (its child stays in the same React tree) whose
 * island is connected into that slot through a `ChildSiteLink`. The portal
 * places its content from layout on a visual hung off the island root, clipped
 * where the control clips its own, follows the slot every frame while the
 * control animates, sizes the slot from its child, and carries focus in and
 * out.
 *
 * What the renderer imposed, each learned the hard way on Windows App SDK 1.8
 * and react-native-windows 0.84:
 * - An island mounted under a portal whose island is not connected yet aborts
 *   the process ("Parent island must be connected", in a noexcept OnMounted).
 *   React children mount after `onReady`.
 * - A hand-in visual under a control's animated content renders away from where
 *   layout, the visual chain and the link transform say. The placement visual
 *   hangs off the island root instead, positioned from `TransformToVisual`.
 * - WinUI's `Expanding` and `Collapsed` events both fire as a motion starts.
 *   Opening takes about 333 ms, closing about 180 ms; timers end the motion.
 * - RNW hands every view mounted under a portal to the mount handler, not
 *   only the direct child; only the first direct child sizes the slot.
 * - RNW never re-enters a nested island it still holds as its focused
 *   component (`SetFocusedComponent` returns early), and a departure returns to
 *   the host that navigated in. The portal enters such an island directly and
 *   handles that host's departure as leaving.
 * - Hiding the content by unmounting it or `display: none` destroys or zeroes
 *   nested islands, after which RNW's UI Automation tree enumerates nothing on
 *   the page. Content hides on the compositor and reports `onVisibleChange`.
 * - Measuring inside `LayoutUpdated` trips XAML's layout-cycle guard, which
 *   fails fast. Remeasures run on the next dispatcher turn.
 * - Composition visuals have no weak references.
 * - RNW flattens plain views away, and mounts a relaid subtree bottom up. The
 *   portal's one direct child is found by its parent, not by mount order, and
 *   the JavaScript side keeps its wrapper a view with `collapsable={false}`.
 * - A windowed popup renders its child in a window of its own, with an island
 *   of its own that its visuals report only a frame after it opens. A slot in
 *   one connects to that island, with the popup's child as the tree root; the
 *   popup root above it is a sizeless canvas in the main island.
 * - An island draws above the React Native content beside it whatever the
 *   order, so content on a material island goes inside it, through a portal.
 * - A system backdrop on a child island samples what is behind the window and
 *   fills the island's rectangle. WinUI's `MicaBackdrop` and
 *   `DesktopAcrylicBackdrop` render there; a custom `SystemBackdrop` gets no
 *   default configuration and makes its own (Backdrop.cpp).
 */
namespace winrt::ExpoInterface {

namespace {

namespace content = winrt::Microsoft::UI::Content;
namespace input = winrt::Microsoft::UI::Input;
namespace hosting = winrt::Microsoft::UI::Xaml::Hosting;
namespace dispatching = winrt::Microsoft::UI::Dispatching;


/** WinUI's Expander opens in about 333 ms and closes in about 180 ms; the motion is over after these. */
constexpr auto kOpenSettle = std::chrono::milliseconds(400);
constexpr auto kCloseSettle = std::chrono::milliseconds(220);
/** A departing anchor's GotFocus arrives a turn later; entries this soon after leaving are the bounce. */
constexpr uint64_t kReentryWindow = 150;

// -- The slot contract -------------------------------------------------------

struct Slot {
  winrt::weak_ref<controls::Grid> grid;
  /** The element the control clips its content area to, so a portal clips the same way. */
  winrt::weak_ref<xaml::FrameworkElement> clip;
  std::function<void()> waiting;
  bool settled{true};
  /** (settled, opening): at rest, or in motion and which way. */
  std::function<void(bool, bool)> onSettled;
};

std::map<std::string, Slot> &Slots() noexcept {
  static std::map<std::string, Slot> slots;
  return slots;
}

} // namespace

void RegisterSlot(const std::string &name, const controls::Grid &grid) noexcept {
  auto &slot = Slots()[name];
  slot.grid = grid;
  if (slot.waiting) {
    auto waiting = std::move(slot.waiting);
    slot.waiting = nullptr;
    waiting();
  }
}

void UnregisterSlot(const std::string &name) noexcept {
  Slots().erase(name);
}

namespace {

controls::Grid FindSlot(const std::string &name) noexcept {
  auto it = Slots().find(name);
  return it == Slots().end() ? nullptr : it->second.grid.get();
}

void WaitForSlot(const std::string &name, std::function<void()> waiting) noexcept {
  Slots()[name].waiting = std::move(waiting);
}

void SetSettled(const std::string &name, bool settled, bool opening) noexcept {
  auto &slot = Slots()[name];
  slot.settled = settled;
  if (slot.onSettled) slot.onSettled(settled, opening);
}

bool IsSettled(const std::string &name) noexcept {
  auto it = Slots().find(name);
  return it == Slots().end() || it->second.settled;
}

void WatchSettled(const std::string &name, std::function<void(bool, bool)> onSettled) noexcept {
  Slots()[name].onSettled = std::move(onSettled);
}

void SetSlotClip(const std::string &name, const xaml::FrameworkElement &clip) noexcept {
  Slots()[name].clip = clip;
}

xaml::FrameworkElement FindSlotClip(const std::string &name) noexcept {
  auto it = Slots().find(name);
  return it == Slots().end() ? nullptr : it->second.clip.get();
}

/** The first element of a name under `root` in the visual tree: a part of a control's template, once applied. */
xaml::FrameworkElement FindNamed(const xaml::DependencyObject &root, const wchar_t *name) noexcept {
  const auto count = xaml::Media::VisualTreeHelper::GetChildrenCount(root);
  for (int32_t index = 0; index < count; ++index) {
    auto child = xaml::Media::VisualTreeHelper::GetChild(root, index);
    if (auto element = child.try_as<xaml::FrameworkElement>(); element && element.Name() == name) return element;
    if (auto found = FindNamed(child, name)) return found;
  }
  return nullptr;
}

/**
 * One container visual per tree root, set as the root element's child visual,
 * that every portal under that root puts its frame into. Each frame clips
 * itself to its control's content area; the layer clips nothing, since a
 * windowed popup's root is a canvas with no size of its own. Strong
 * references: composition visuals have no IWeakReferenceSource, and a
 * weak_ref to one dereferences null.
 */
winrt::Microsoft::UI::Composition::ContainerVisual LayerFor(const xaml::UIElement &root) {
  static std::map<void *, winrt::Microsoft::UI::Composition::ContainerVisual> layers;
  const auto key = winrt::get_abi(root);
  if (auto it = layers.find(key); it != layers.end()) return it->second;
  auto compositor = hosting::ElementCompositionPreview::GetElementVisual(root).Compositor();
  auto layer = compositor.CreateContainerVisual();
  hosting::ElementCompositionPreview::SetElementChildVisual(root, layer);
  layers.insert_or_assign(key, layer);
  return layer;
}

// -- Expander ----------------------------------------------------------------

/**
 * A WinUI `Expander` whose content area is a slot. The header is XAML; the
 * content is whatever portal names the same slot.
 */
struct ExpanderView : winrt::implements<ExpanderView, winrt::IInspectable>,
                      Codegen::BaseExpoInterfaceExpander<ExpanderView>,
                      XamlIsland<ExpanderView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_expander = controls::Expander{};
    m_expander.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
    m_expander.VerticalAlignment(xaml::VerticalAlignment::Top);
    m_expander.HorizontalContentAlignment(xaml::HorizontalAlignment::Stretch);
    m_header = controls::TextBlock{};
    m_expander.Header(m_header);
    m_slot = controls::Grid{};
    m_slot.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
    m_slot.MinHeight(8);
    m_expander.Content(m_slot);
    // Both events fire as the motion starts; the timer in OnExpandedChanged ends it.
    m_expander.Expanding([weak = get_weak()](const controls::Expander &, const controls::ExpanderExpandingEventArgs &) {
      if (auto strong = weak.get()) strong->Emit(true);
    });
    m_expander.Collapsed([weak = get_weak()](const controls::Expander &, const controls::ExpanderCollapsedEventArgs &) {
      if (auto strong = weak.get()) strong->Emit(false);
    });
    m_expander.RegisterPropertyChangedCallback(controls::Expander::IsExpandedProperty(), [weak = get_weak()](const xaml::DependencyObject &, const xaml::DependencyProperty &) {
      if (auto strong = weak.get()) strong->OnExpandedChanged();
    });
    // The Expander's desired size follows its content showing and hiding a
    // layout pass later than its own size does, and XAML does not measure the
    // island's panel again by itself.
    m_expander.SizeChanged([weak = get_weak()](const winrt::IInspectable &, const xaml::SizeChangedEventArgs &) {
      if (auto strong = weak.get(); strong && !strong->m_closing) strong->Remeasure();
    });
    m_expander.LayoutUpdated([weak = get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) strong->SyncDesiredSize();
    });
    // Once the template is applied, the element WinUI clips the content area to
    // is what a portal clips its content to as well, so the React content slides
    // out from under the header as XAML's would. An Expander that loads expanded
    // plays its opening motion too, and the portal follows it the same way.
    m_expander.Loaded([weak = get_weak()](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
      if (auto strong = weak.get()) {
        strong->m_clip = FindNamed(strong->m_expander, L"ExpanderContentClip");
        strong->PublishClip();
        if (strong->m_expander.IsExpanded()) strong->OnExpandedChanged();
      }
    });
    Attach(islandView, m_expander);
    islandView.Destroying([weak = get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) {
        if (strong->m_timer) strong->m_timer.Stop();
        if (!strong->m_slotName.empty()) UnregisterSlot(strong->m_slotName);
      }
    });
  }

  /**
   * While closing, the island keeps its size: WinUI drops the Expander's
   * desired size at the start of the motion though its content still slides
   * for 180 ms, and an island shrunk to the header would cut that off.
   */
  void ReportDesiredSize(Size size) noexcept {
    if (m_closing) return;
    XamlIsland<ExpanderView>::ReportDesiredSize(size);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceExpanderProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceExpanderProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceExpander<ExpanderView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    m_header.Text(ToHString(props->header));
    SetIdentity(m_expander, std::optional<std::string>{props->header}, props->ViewProps);
    // Only a change of the prop moves the control, and a move the prop made is
    // not reported back as a toggle.
    const bool expanded = props->expanded.value_or(false);
    if (!oldProps || oldProps->expanded.value_or(false) != expanded) {
      m_applying = true;
      m_expander.IsExpanded(expanded);
      m_applying = false;
    }
    if (props->slot != m_slotName) {
      if (!m_slotName.empty()) UnregisterSlot(m_slotName);
      m_slotName = props->slot;
      RegisterSlot(m_slotName, m_slot);
      PublishClip();
    }
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  void Emit(bool expanded) noexcept {
    if (m_applying) return;
    if (auto emitter = EventEmitter()) {
      Codegen::ExpoInterfaceExpanderEventEmitter::OnToggle value;
      value.expanded = expanded;
      emitter->onToggle(std::move(value));
    }
  }

  /** The clip element reaches the slot once both it and the slot's name are known, whichever comes last. */
  void PublishClip() noexcept {
    if (m_clip && !m_slotName.empty()) SetSlotClip(m_slotName, m_clip);
  }

  void OnExpandedChanged() noexcept {
    if (m_slotName.empty()) return;
    const bool opening = m_expander.IsExpanded();
    m_closing = !opening;
    SetSettled(m_slotName, false, opening);
    if (m_timer) m_timer.Stop();
    // Opening: the content is laid out from the start, so the island takes its
    // expanded size at once and WinUI's motion plays inside it. Closing: the
    // island holds its size so the content can slide up under the header.
    if (opening) Remeasure();
    m_timer = dispatching::DispatcherQueue::GetForCurrentThread().CreateTimer();
    m_timer.Interval(opening ? kOpenSettle : kCloseSettle);
    m_timer.IsRepeating(false);
    m_timer.Tick([weak = get_weak(), opening](const winrt::IInspectable &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) {
        strong->m_closing = false;
        strong->Remeasure();
        SetSettled(strong->m_slotName, true, opening);
      }
    });
    m_timer.Start();
  }

  /** From LayoutUpdated, so it must not measure; it remeasures on the next dispatcher turn. */
  void SyncDesiredSize() noexcept {
    try {
      const auto desired = m_expander.DesiredSize();
      if (desired.Width == m_lastDesired.Width && desired.Height == m_lastDesired.Height) return;
      m_lastDesired = desired;
      if (m_closing) return;
      dispatching::DispatcherQueue::GetForCurrentThread().TryEnqueue([weak = get_weak()]() {
        if (auto strong = weak.get(); strong && !strong->m_closing) strong->Remeasure();
      });
    } catch (...) {
    }
  }

  controls::Expander m_expander{nullptr};
  controls::TextBlock m_header{nullptr};
  controls::Grid m_slot{nullptr};
  xaml::FrameworkElement m_clip{nullptr};
  dispatching::DispatcherQueueTimer m_timer{nullptr};
  std::string m_slotName;
  Size m_lastDesired{0, 0};
  bool m_closing{false};
  bool m_applying{false};
};

// -- Material ----------------------------------------------------------------

/**
 * A box drawn on one of Windows' materials, its whole area a slot. Mica and
 * acrylic are system backdrops: the compositor draws them behind the island
 * from what is behind the window, and they render on a child island. A system
 * backdrop also clears the island's own fill, so the tint on the slot is the
 * only paint over the material. The content is whatever portal names the
 * slot, and the island takes the height the content lays out to; without a
 * slot it is a box of material sized by its style.
 */
struct MaterialView : winrt::implements<MaterialView, winrt::IInspectable>,
                      Codegen::BaseExpoInterfaceMaterial<MaterialView>,
                      XamlIsland<MaterialView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_slot = controls::Grid{};
    m_slot.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
    m_slot.VerticalAlignment(xaml::VerticalAlignment::Stretch);
    m_slot.MinHeight(1);
    // The portal gives the slot its content's height; the island follows.
    m_slot.SizeChanged([weak = get_weak()](const winrt::IInspectable &, const xaml::SizeChangedEventArgs &) {
      if (auto strong = weak.get()) strong->Remeasure();
    });
    Attach(islandView, m_slot);
    islandView.Destroying([weak = get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
      if (auto strong = weak.get(); strong && !strong->m_slotName.empty()) UnregisterSlot(strong->m_slotName);
    });
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceMaterialProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceMaterialProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceMaterial<MaterialView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    SetIdentity(m_slot, std::nullopt, props->ViewProps);
    const std::string material = props->material.value_or("acrylic");
    if (material != m_material) {
      m_material = material;
      try {
        if (material == "none") {
          Island().SystemBackdrop(nullptr);
        } else if (material == "mica" || material == "micaAlt") {
          media::MicaBackdrop mica;
          mica.Kind(material == "micaAlt" ? winrt::Microsoft::UI::Composition::SystemBackdrops::MicaKind::BaseAlt : winrt::Microsoft::UI::Composition::SystemBackdrops::MicaKind::Base);
          Island().SystemBackdrop(mica);
        } else if (material == "acrylic") {
          Island().SystemBackdrop(media::DesktopAcrylicBackdrop{});
        } else {
          Island().SystemBackdrop(winrt::make<implementation::MaterialBackdrop>(ToHString(material)));
        }
      } catch (const winrt::hresult_error &) {
      }
    }
    Color tint{};
    if (props->tintColor && TryParseColor(*props->tintColor, tint)) {
      m_slot.Background(Brush(tint));
    } else {
      m_slot.Background(nullptr);
    }
    const std::string slot = props->slot.value_or("");
    if (slot != m_slotName) {
      if (!m_slotName.empty()) UnregisterSlot(m_slotName);
      m_slotName = slot;
      if (!m_slotName.empty()) RegisterSlot(m_slotName, m_slot);
    }
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  controls::Grid m_slot{nullptr};
  std::string m_slotName;
  std::string m_material;
};

// -- Portal ------------------------------------------------------------------

/** The constraints the portal's child is laid out in: the slot's width, any height. */
struct PortalState : winrt::implements<PortalState, composition::IPortalStateData> {
  PortalState(rn::LayoutConstraints constraints, float scale) : m_constraints(constraints), m_scale(scale) {}
  rn::LayoutConstraints LayoutConstraints() const noexcept {
    return m_constraints;
  }
  float PointScaleFactor() const noexcept {
    return m_scale;
  }

 private:
  rn::LayoutConstraints m_constraints;
  float m_scale{1.0f};
};

struct PortalView : winrt::implements<PortalView, winrt::IInspectable>, Codegen::BaseExpoInterfacePortal<PortalView> {
  void InitializePortal(const composition::PortalComponentView &portal) noexcept {
    portal.Mounted([](const winrt::IInspectable &, const rn::ComponentView &view) {
      view.UserData().as<PortalView>()->OnMounted(view);
    });
    portal.Unmounted([](const winrt::IInspectable &, const rn::ComponentView &view) {
      view.UserData().as<PortalView>()->OnUnmounted(view);
    });
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfacePortalProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfacePortalProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfacePortal<PortalView>::UpdateProps(view, newProps, oldProps);
    if (auto props = Props()) m_slotName = props->slot;
    if (m_mounted) TryConnect(view);
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    m_state = newState;
  }

  /**
   * RNW reports every view mounted under the portal here, not only the
   * portal's own child. Only the first direct child sizes the slot: a nested
   * island's own metrics would otherwise shrink the slot for a frame on every
   * relayout.
   */
  void MountChildComponentView(const rn::ComponentView &, const rn::MountChildComponentViewArgs &args) noexcept override {
    if (!IsDirectChild(args.Child()) || m_child) return;
    m_child = args.Child();
    m_childToken = args.Child().LayoutMetricsChanged([weak = get_weak()](const winrt::IInspectable &, const rn::LayoutMetricsChangedArgs &changed) {
      if (auto strong = weak.get()) strong->Resize(changed.NewLayoutMetrics());
    });
    Resize(args.Child().LayoutMetrics());
  }

  void UnmountChildComponentView(const rn::ComponentView &, const rn::UnmountChildComponentViewArgs &args) noexcept override {
    if (!m_child || args.Child() != m_child) return;
    if (m_childToken) args.Child().LayoutMetricsChanged(m_childToken);
    m_childToken = {};
    m_child = nullptr;
  }

 private:
  /** Whether the view's parent is the portal's own root: the one direct child, whatever order RNW mounts the subtree in. */
  bool IsDirectChild(const rn::ComponentView &child) const noexcept {
    try {
      auto portal = m_portal.get();
      if (!portal) return false;
      rn::ComponentView root = portal.ContentRoot();
      return child.Parent() == root;
    } catch (...) {
      return false;
    }
  }

  void OnMounted(const rn::ComponentView &view) noexcept {
    m_mounted = true;
    TryConnect(view);
  }

  void OnUnmounted(const rn::ComponentView &) noexcept {
    m_mounted = false;
    Disconnect();
  }

  void TryConnect(const rn::ComponentView &view) noexcept {
    if (m_link || m_slotName.empty()) return;
    auto grid = FindSlot(m_slotName);
    if (!grid) {
      WaitForSlot(m_slotName, [weak = get_weak(), wkView = winrt::make_weak(view)]() {
        auto strong = weak.get();
        auto strongView = wkView.get();
        if (strong && strongView) strong->TryConnect(strongView);
      });
      return;
    }
    auto xamlRoot = grid.XamlRoot();
    if (!xamlRoot) {
      grid.Loaded([weak = get_weak(), wkView = winrt::make_weak(view)](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
        auto strong = weak.get();
        auto strongView = wkView.get();
        if (strong && strongView) strong->TryConnect(strongView);
      });
      return;
    }
    try {
      auto portal = view.as<composition::PortalComponentView>();
      m_portal = winrt::make_weak(portal);
      // The top of the tree the slot is in: the hosting island's own root, or
      // a windowed popup's, which is not the XamlRoot's content. A popup is a
      // window of its own with an island of its own, found from the slot's
      // visual once XAML has moved the popup's tree there, a frame or so after
      // it opens; until then the visual still reports the XamlRoot's island.
      // Every popup is a logical child of the XamlRoot's popup root, a canvas
      // in the main island; a windowed popup renders its own child and below
      // in a window of its own. The tree root for the layer is that child.
      xaml::UIElement top = grid;
      xaml::UIElement below = grid;
      for (xaml::DependencyObject node = grid; node; node = xaml::Media::VisualTreeHelper::GetParent(node)) {
        if (auto element = node.try_as<xaml::UIElement>()) {
          below = top;
          top = element;
        }
      }
      const bool inPopup = top != xamlRoot.Content();
      if (inPopup) top = below;
      content::ContentIsland island{nullptr};
      try {
        island = content::ContentIsland::GetByVisual(hosting::ElementCompositionPreview::GetElementVisual(grid));
      } catch (const winrt::hresult_error &) {
      }
      const bool sameIsland = island && winrt::get_unknown(island) == winrt::get_unknown(xamlRoot.ContentIsland());
      if (inPopup && (!island || sameIsland)) {
        if (m_deferrals++ < 60) {
          m_defer = dispatching::DispatcherQueue::GetForCurrentThread().CreateTimer();
          m_defer.Interval(std::chrono::milliseconds(16));
          m_defer.IsRepeating(false);
          m_defer.Tick([weak = get_weak(), wkView = winrt::make_weak(view)](const winrt::IInspectable &, const winrt::IInspectable &) {
            auto strong = weak.get();
            auto strongView = wkView.get();
            if (strong && strongView) strong->TryConnect(strongView);
          });
          m_defer.Start();
        }
        return;
      }
      m_deferrals = 0;
      m_parentIsland = island ? island : xamlRoot.ContentIsland();
      m_root = top;
      m_grid = grid;
      // A clipped frame at the control's content area, and the placement inside
      // it at the slot's position, both hung off the island root and positioned
      // from layout.
      m_layer = LayerFor(m_root);
      m_frame = m_layer.Compositor().CreateContainerVisual();
      m_frame.Clip(m_layer.Compositor().CreateInsetClip());
      m_layer.Children().InsertAtTop(m_frame);
      m_placement = m_layer.Compositor().CreateContainerVisual();
      m_frame.Children().InsertAtTop(m_placement);
      m_link = content::ChildSiteLink::Create(m_parentIsland, m_placement);
      m_island = rn::ReactNativeIsland::CreatePortal(portal);
      m_link.Connect(m_island.Island());
      UpdateTransform();
      grid.LayoutUpdated([weak = get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
        if (auto strong = weak.get()) strong->UpdateTransform();
      });
      m_sizeToken = grid.SizeChanged([weak = get_weak()](const winrt::IInspectable &, const xaml::SizeChangedEventArgs &args) {
        if (auto strong = weak.get()) strong->OnSlotSize(args.NewSize());
      });
      // Focus, both ways: a tab stop in the slot hands focus into the React
      // content, and the content departing hands it on to the next XAML element.
      m_anchor = controls::ContentControl{};
      m_anchor.IsTabStop(true);
      m_anchor.UseSystemFocusVisuals(false);
      m_anchor.Width(1);
      m_anchor.Height(1);
      m_anchor.HorizontalAlignment(xaml::HorizontalAlignment::Left);
      m_anchor.VerticalAlignment(xaml::VerticalAlignment::Top);
      grid.Children().Append(m_anchor);
      m_anchor.GettingFocus([weak = get_weak()](const winrt::IInspectable &, const xaml::Input::GettingFocusEventArgs &args) {
        if (auto strong = weak.get()) strong->m_enterBackward = args.Direction() == xaml::Input::FocusNavigationDirection::Previous;
      });
      m_anchor.GotFocus([weak = get_weak()](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
        if (auto strong = weak.get()) strong->EnterFromXaml();
      });
      m_navigation = input::InputFocusNavigationHost::GetForSiteLink(m_link);
      m_departToken = m_navigation.DepartFocusRequested([weak = get_weak()](const input::InputFocusNavigationHost &, const input::FocusNavigationRequestEventArgs &args) {
        // The React root departs with `Last` when its focus ran off the end going forward.
        if (auto strong = weak.get()) strong->LeaveToXaml(args.Request().Reason() == input::FocusNavigationReason::Last, args);
      });
      // While the control animates its content area, the slot moves every frame
      // and layout does not run for it, so the placement follows it from the
      // rendering callback; at rest, layout updates are enough. A control already
      // in motion when the portal connects is followed from now on.
      m_settled = IsSettled(m_slotName);
      Track(!m_settled);
      WatchSettled(m_slotName, [weak = get_weak()](bool settled, bool opening) {
        if (auto strong = weak.get()) {
          strong->m_settled = settled;
          strong->m_closing = !settled && !opening;
          strong->m_origin = {-1, -1};
          strong->Track(!settled);
          strong->UpdateTransform();
        }
      });
      const float width = SlotWidth();
      UpdateConstraints(width);
      m_link.ActualSize({width, static_cast<float>(grid.ActualHeight())});
      if (m_child) Resize(m_child.LayoutMetrics());
      if (auto emitter = EventEmitter()) {
        Codegen::ExpoInterfacePortalEventEmitter::OnReady ready;
        ready.connected = true;
        emitter->onReady(std::move(ready));
      }
    } catch (const winrt::hresult_error &) {
    }
  }

  void Disconnect() noexcept {
    try {
      Track(false);
      if (m_navigation && m_departToken) m_navigation.DepartFocusRequested(m_departToken);
      m_departToken = {};
      m_navigation = nullptr;
      if (m_nestedHost && m_nestedToken) m_nestedHost.DepartFocusRequested(m_nestedToken);
      m_nestedToken = {};
      m_nestedHost = nullptr;
      if (m_grid && m_sizeToken) m_grid.SizeChanged(m_sizeToken);
      m_sizeToken = {};
      if (m_layer && m_frame) m_layer.Children().Remove(m_frame);
      if (m_grid) {
        if (m_anchor) {
          uint32_t index = 0;
          if (m_grid.Children().IndexOf(m_anchor, index)) m_grid.Children().RemoveAt(index);
        }
        m_grid.ClearValue(xaml::FrameworkElement::HeightProperty());
      }
      if (auto closable = m_link ? m_link.try_as<winrt::Windows::Foundation::IClosable>() : nullptr) closable.Close();
    } catch (const winrt::hresult_error &) {
    }
    m_link = nullptr;
    m_island = nullptr;
    m_placement = nullptr;
    m_frame = nullptr;
    m_layer = nullptr;
    m_root = nullptr;
    m_anchor = nullptr;
    m_grid = nullptr;
    m_parentIsland = nullptr;
    m_origin = {-1, -1};
  }

  /** Follows the slot from the rendering callback (every frame) while `on`. */
  void Track(bool on) noexcept {
    if (on && !m_renderingToken) {
      m_renderingToken = xaml::Media::CompositionTarget::Rendering([weak = get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
        if (auto strong = weak.get()) strong->UpdateTransform();
      });
    } else if (!on && m_renderingToken) {
      xaml::Media::CompositionTarget::Rendering(m_renderingToken);
      m_renderingToken = {};
    }
  }

  /** Whether the slot and everything above it is visible, so a collapsed control hides the content. */
  bool SlotVisible() const noexcept {
    for (xaml::DependencyObject node = m_grid; node; node = xaml::Media::VisualTreeHelper::GetParent(node)) {
      if (auto element = node.try_as<xaml::UIElement>(); element && element.Visibility() != xaml::Visibility::Visible) return false;
    }
    // Before its first layout pass the slot has no size at all; that is not a collapsed control.
    if (m_grid.ActualWidth() == 0 && m_grid.ActualHeight() == 0) return true;
    return m_grid.ActualHeight() > 0;
  }

  /** Hides on the compositor by clipping the frame to nothing; the next pass lays it out afresh when shown. */
  void ApplyHidden(bool hidden) noexcept {
    if (hidden) m_frame.Size({0.0f, 0.0f});
    m_origin = {-1, -1};
    m_clipOrigin = {-1, -1};
    m_clipSize = {0, 0};
    if (auto emitter = EventEmitter()) {
      Codegen::ExpoInterfacePortalEventEmitter::OnVisibleChange change;
      change.visible = !hidden;
      emitter->onVisibleChange(std::move(change));
    }
  }

  /** Puts the frame at the control's clip and the placement at the slot, and tells the link the slot's place. */
  void UpdateTransform() noexcept {
    if (!m_link || !m_grid || !m_root) return;
    try {
      const bool visible = SlotVisible();
      if (visible != m_visible) {
        m_visible = visible;
        ApplyHidden(!visible);
      }
      if (!visible) return;
      const auto origin = m_grid.TransformToVisual(m_root).TransformPoint({0, 0});
      auto clipElement = FindSlotClip(m_slotName);
      xaml::FrameworkElement clipTarget = clipElement ? clipElement : xaml::FrameworkElement(m_grid);
      const auto clipOrigin = clipTarget.TransformToVisual(m_root).TransformPoint({0, 0});
      const Size clipSize{static_cast<float>(clipTarget.ActualWidth()), static_cast<float>(clipTarget.ActualHeight())};
      if (origin.X == m_origin.X && origin.Y == m_origin.Y && clipOrigin.X == m_clipOrigin.X && clipOrigin.Y == m_clipOrigin.Y && clipSize.Width == m_clipSize.Width && clipSize.Height == m_clipSize.Height) return;
      m_origin = origin;
      m_clipOrigin = clipOrigin;
      m_clipSize = clipSize;
      m_frame.Offset({clipOrigin.X, clipOrigin.Y, 0.0f});
      m_frame.Size({clipSize.Width, clipSize.Height});
      m_placement.Offset({origin.X - clipOrigin.X, origin.Y - clipOrigin.Y, 0.0f});
      // Pointer input and automation both convert through this, in points.
      m_link.LocalToParentTransformMatrix(winrt::Windows::Foundation::Numerics::make_float4x4_translation(origin.X, origin.Y, 0.0f));
    } catch (const winrt::hresult_error &) {
    }
  }

  float SlotWidth() const noexcept {
    const auto width = m_grid ? m_grid.ActualWidth() : 0.0;
    return width > 0 ? static_cast<float>(width) : 280.0f;
  }

  /** The slot's maximum height, when its control gives it one; content taller than it scrolls inside. */
  float SlotMaxHeight() const noexcept {
    const auto max = m_grid ? m_grid.MaxHeight() : std::numeric_limits<double>::infinity();
    return std::isfinite(max) && max > 0 ? static_cast<float>(max) : std::numeric_limits<float>::infinity();
  }

  void UpdateConstraints(float width) noexcept {
    if (!m_state || !m_parentIsland) return;
    rn::LayoutConstraints constraints;
    constraints.MinimumSize = {width, 0};
    constraints.MaximumSize = {width, SlotMaxHeight()};
    constraints.LayoutDirection = rn::LayoutDirection::Undefined;
    const auto direction = m_parentIsland.LayoutDirection();
    if (direction == content::ContentLayoutDirection::LeftToRight) constraints.LayoutDirection = rn::LayoutDirection::LeftToRight;
    if (direction == content::ContentLayoutDirection::RightToLeft) constraints.LayoutDirection = rn::LayoutDirection::RightToLeft;
    m_state.UpdateState(winrt::make<PortalState>(constraints, m_parentIsland.RasterizationScale()));
  }

  void OnSlotSize(Size size) noexcept {
    if (!m_link || size.Width <= 0 || size.Width == m_width) return;
    m_width = size.Width;
    UpdateConstraints(m_width);
    try {
      m_link.ActualSize({size.Width, m_height > 0 ? m_height : size.Height});
      m_placement.Size({size.Width, m_height > 0 ? m_height : size.Height});
    } catch (...) {
    }
  }

  /** The child laid out: the slot takes its height and the link its size, in whole points. */
  void Resize(const rn::LayoutMetrics &metrics) noexcept {
    if (!m_link || !m_grid) return;
    const float height = std::min(std::ceil(metrics.Frame.Height), SlotMaxHeight());
    if (metrics.Frame.Width == 0 && height == 0) return;
    // A text line lays out 82.62 one pass and 83 the next; whole points keep
    // the slot, the island and the link still.
    if (height == 0 && !m_visible) return;
    if (height == m_height) return;
    m_height = height;
    try {
      m_grid.Height(height);
      m_link.ActualSize({SlotWidth(), height});
      m_placement.Size({SlotWidth(), height});
    } catch (...) {
    }
  }

  void EnterFromXaml() noexcept {
    if (m_leaving || !m_navigation || GetTickCount64() - m_leftAt < kReentryWindow) return;
    try {
      // Content that is hidden or closing takes no focus; the island's first
      // control (the header) is where it belongs.
      if (m_closing || !m_visible) {
        if (auto first = xaml::Input::FocusManager::FindFirstFocusableElement(m_root).try_as<xaml::UIElement>()) {
          m_leftAt = GetTickCount64();
          first.Focus(xaml::FocusState::Programmatic);
        }
        return;
      }
      const auto reason = m_enterBackward ? input::FocusNavigationReason::Last : input::FocusNavigationReason::First;
      // RNW keeps its focused component while the island is out of focus, and
      // `SetFocusedComponent` returns early when navigation lands on that same
      // component, so a nested island that had focus before is never entered
      // again. When the root already holds a nested island as focused, enter that
      // island directly, and keep the host, since the departure returns to the
      // host that navigated in.
      rn::ComponentView focused{nullptr};
      if (auto portal = m_portal.get()) focused = portal.ContentRoot().GetFocusedComponent();
      if (auto nested = focused ? focused.try_as<composition::ContentIslandComponentView>() : nullptr) {
        if (auto link = nested.ChildSiteLink()) {
          if (m_nestedHost && m_nestedToken) m_nestedHost.DepartFocusRequested(m_nestedToken);
          m_nestedHost = input::InputFocusNavigationHost::GetForSiteLink(link);
          m_nestedToken = m_nestedHost.DepartFocusRequested([weak = get_weak()](const input::InputFocusNavigationHost &, const input::FocusNavigationRequestEventArgs &args) {
            // A XAML island departs with `First` going forward.
            if (auto strong = weak.get()) strong->LeaveToXaml(args.Request().Reason() != input::FocusNavigationReason::Last, args);
          });
          if (m_nestedHost.NavigateFocus(input::FocusNavigationRequest::Create(reason)) == input::FocusNavigationResult::Moved) return;
        }
      }
      m_navigation.NavigateFocus(input::FocusNavigationRequest::Create(reason));
    } catch (const winrt::hresult_error &) {
    }
  }

  void LeaveToXaml(bool forward, const input::FocusNavigationRequestEventArgs &args) noexcept {
    m_leaving = true;
    m_leftAt = GetTickCount64();
    bool moved = false;
    try {
      if (m_anchor) {
        // The move is relative to XAML's focused element, so the anchor takes
        // focus first; its GotFocus arrives a turn later, inside the re-entry
        // window. A WinUI desktop app must give the search root.
        m_anchor.Focus(xaml::FocusState::Programmatic);
        xaml::Input::FindNextElementOptions options;
        options.SearchRoot(m_root);
        moved = xaml::Input::FocusManager::TryMoveFocus(forward ? xaml::Input::FocusNavigationDirection::Next : xaml::Input::FocusNavigationDirection::Previous, options);
        if (!moved) {
          if (auto first = xaml::Input::FocusManager::FindFirstFocusableElement(m_root).try_as<xaml::UIElement>()) {
            moved = first.Focus(xaml::FocusState::Programmatic);
          }
        }
      }
    } catch (const winrt::hresult_error &) {
    }
    m_leaving = false;
    args.Result(moved ? input::FocusNavigationResult::Moved : input::FocusNavigationResult::NotMoved);
  }

  std::string m_slotName;
  dispatching::DispatcherQueueTimer m_defer{nullptr};
  int m_deferrals{0};
  bool m_mounted{false};
  bool m_leaving{false};
  bool m_enterBackward{false};
  bool m_visible{true};
  bool m_settled{true};
  bool m_closing{false};
  uint64_t m_leftAt{0};
  float m_width{0};
  float m_height{0};
  winrt::Windows::Foundation::Point m_origin{-1, -1};
  winrt::Windows::Foundation::Point m_clipOrigin{-1, -1};
  Size m_clipSize{0, 0};
  rn::IComponentState m_state{nullptr};
  winrt::weak_ref<composition::PortalComponentView> m_portal;
  rn::ComponentView m_child{nullptr};
  winrt::event_token m_childToken{};
  controls::Grid m_grid{nullptr};
  controls::ContentControl m_anchor{nullptr};
  winrt::event_token m_sizeToken{};
  winrt::event_token m_renderingToken{};
  content::ContentIsland m_parentIsland{nullptr};
  xaml::UIElement m_root{nullptr};
  winrt::Microsoft::UI::Composition::ContainerVisual m_layer{nullptr};
  winrt::Microsoft::UI::Composition::ContainerVisual m_frame{nullptr};
  winrt::Microsoft::UI::Composition::ContainerVisual m_placement{nullptr};
  content::ChildSiteLink m_link{nullptr};
  rn::ReactNativeIsland m_island{nullptr};
  input::InputFocusNavigationHost m_navigation{nullptr};
  winrt::event_token m_departToken{};
  input::InputFocusNavigationHost m_nestedHost{nullptr};
  winrt::event_token m_nestedToken{};
};

} // namespace

void RegisterPortal(const rn::IReactPackageBuilder &packageBuilder) noexcept {
  RegisterIsland<ExpanderView>(packageBuilder, &Codegen::RegisterExpoInterfaceExpanderNativeComponent<ExpanderView>);
  RegisterIsland<MaterialView>(packageBuilder, &Codegen::RegisterExpoInterfaceMaterialNativeComponent<MaterialView>);
  Codegen::RegisterExpoInterfacePortalNativeComponent<PortalView>(
      packageBuilder, [](const composition::IReactCompositionViewComponentBuilder &builder) {
        builder.SetPortalComponentViewInitializer([](const composition::PortalComponentView &portal) noexcept {
          auto view = winrt::make_self<PortalView>();
          view->InitializePortal(portal);
          portal.UserData(*view);
        });
      });
}

} // namespace winrt::ExpoInterface

#else

namespace winrt::ExpoInterface {
void RegisterPortal(const winrt::Microsoft::ReactNative::IReactPackageBuilder &) noexcept {}
void RegisterSlot(const std::string &, const winrt::Microsoft::UI::Xaml::Controls::Grid &) noexcept {}
void UnregisterSlot(const std::string &) noexcept {}
} // namespace winrt::ExpoInterface

#endif // RNW_NEW_ARCH
