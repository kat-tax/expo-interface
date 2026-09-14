#pragma once

#ifdef RNW_NEW_ARCH

#include "YogaXamlPanel.g.h"
#include <functional>

namespace winrt::ExpoInterface::implementation {

/**
 * The root of every island the kit hosts: a panel holding one XAML control
 * that measures it with no constraints, reports the size the control wants
 * (`onMeasured`, which the component view hands to Yoga through its state),
 * then measures and arranges it in the size Yoga gave. The control fills the
 * island; the island is the size the control asked for, or the size a style
 * stretched it to.
 */
struct YogaXamlPanel : YogaXamlPanelT<YogaXamlPanel> {
  using Super = YogaXamlPanelT<YogaXamlPanel>;

  YogaXamlPanel(std::function<void(winrt::Windows::Foundation::Size size)> &&onMeasured);

  winrt::Windows::Foundation::Size MeasureOverride(winrt::Windows::Foundation::Size availableSize);
  winrt::Windows::Foundation::Size ArrangeOverride(winrt::Windows::Foundation::Size finalSize);

 private:
  std::function<void(winrt::Windows::Foundation::Size size)> m_onMeasured;
};

} // namespace winrt::ExpoInterface::implementation

#endif // RNW_NEW_ARCH
