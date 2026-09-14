#include "pch.h"

#ifdef RNW_NEW_ARCH

#include "YogaXamlPanel.h"
#if __has_include("YogaXamlPanel.g.cpp")
#include "YogaXamlPanel.g.cpp"
#endif

namespace winrt::ExpoInterface::implementation {

YogaXamlPanel::YogaXamlPanel(std::function<void(winrt::Windows::Foundation::Size size)> &&onMeasured)
    : Super(), m_onMeasured(std::move(onMeasured)) {}

winrt::Windows::Foundation::Size YogaXamlPanel::MeasureOverride(winrt::Windows::Foundation::Size availableSize) {
  if (Children().Size() == 0) {
    return {0, 0};
  }
  auto child = Children().GetAt(0);

  // What the control wants, unconstrained: the size Yoga lays the island out at
  // unless a style says otherwise.
  child.Measure({std::numeric_limits<float>::max(), std::numeric_limits<float>::max()});
  auto desired = child.DesiredSize();
  if (m_onMeasured) {
    m_onMeasured({desired.Width, desired.Height});
  }

  // What it wants in the size it has: a wrapped text box grows in height
  // when it is narrower than its text.
  child.Measure(availableSize);
  return child.DesiredSize();
}

winrt::Windows::Foundation::Size YogaXamlPanel::ArrangeOverride(winrt::Windows::Foundation::Size finalSize) {
  if (Children().Size() > 0) {
    Children().GetAt(0).Arrange(winrt::Windows::Foundation::Rect{0, 0, finalSize.Width, finalSize.Height});
  }
  return finalSize;
}

} // namespace winrt::ExpoInterface::implementation

#endif // RNW_NEW_ARCH
