
/*
 * This file is auto-generated from ExpoWindowsWebViewNativeComponent spec file in flow / TypeScript.
 */
// clang-format off
#pragma once

#include <NativeModules.h>

#ifdef RNW_NEW_ARCH
#include <JSValueComposition.h>

#include <winrt/Microsoft.ReactNative.Composition.h>
#include <winrt/Microsoft.UI.Composition.h>
#endif // #ifdef RNW_NEW_ARCH

#ifdef RNW_NEW_ARCH

namespace winrt::ExpoWindows::Codegen {

REACT_STRUCT(ExpoWindowsWebViewProps)
struct ExpoWindowsWebViewProps : winrt::implements<ExpoWindowsWebViewProps, winrt::Microsoft::ReactNative::IComponentProps> {
  ExpoWindowsWebViewProps(winrt::Microsoft::ReactNative::ViewProps props, const winrt::Microsoft::ReactNative::IComponentProps& cloneFrom)
    : ViewProps(props)
  {
     if (cloneFrom) {
       auto cloneFromProps = cloneFrom.as<ExpoWindowsWebViewProps>();
       sourceUri = cloneFromProps->sourceUri;
       sourceHtml = cloneFromProps->sourceHtml;
       sourceBaseUrl = cloneFromProps->sourceBaseUrl;
       injectedJavaScriptBeforeContentLoaded = cloneFromProps->injectedJavaScriptBeforeContentLoaded;
       injectedJavaScript = cloneFromProps->injectedJavaScript;
       injectedObjectJson = cloneFromProps->injectedObjectJson;
       userAgent = cloneFromProps->userAgent;
       javaScriptEnabled = cloneFromProps->javaScriptEnabled;
       webviewDebuggingEnabled = cloneFromProps->webviewDebuggingEnabled;
       onMessage = cloneFromProps->onMessage;
       onLoadStart = cloneFromProps->onLoadStart;
       onLoad = cloneFromProps->onLoad;
       onLoadEnd = cloneFromProps->onLoadEnd;
       onLoadingError = cloneFromProps->onLoadingError;
       onNavigationStateChange = cloneFromProps->onNavigationStateChange;  
     }
  }

  void SetProp(uint32_t hash, winrt::hstring propName, winrt::Microsoft::ReactNative::IJSValueReader value) noexcept {
    winrt::Microsoft::ReactNative::ReadProp(hash, propName, value, *this);
  }

  REACT_FIELD(sourceUri)
  std::optional<std::string> sourceUri;

  REACT_FIELD(sourceHtml)
  std::optional<std::string> sourceHtml;

  REACT_FIELD(sourceBaseUrl)
  std::optional<std::string> sourceBaseUrl;

  REACT_FIELD(injectedJavaScriptBeforeContentLoaded)
  std::optional<std::string> injectedJavaScriptBeforeContentLoaded;

  REACT_FIELD(injectedJavaScript)
  std::optional<std::string> injectedJavaScript;

  REACT_FIELD(injectedObjectJson)
  std::optional<std::string> injectedObjectJson;

  REACT_FIELD(userAgent)
  std::optional<std::string> userAgent;

  REACT_FIELD(javaScriptEnabled)
  bool javaScriptEnabled{true};

  REACT_FIELD(webviewDebuggingEnabled)
  std::optional<bool> webviewDebuggingEnabled{};

   // These fields can be used to determine if JS has registered for this event
  REACT_FIELD(onMessage)
  bool onMessage{false};

  REACT_FIELD(onLoadStart)
  bool onLoadStart{false};

  REACT_FIELD(onLoad)
  bool onLoad{false};

  REACT_FIELD(onLoadEnd)
  bool onLoadEnd{false};

  REACT_FIELD(onLoadingError)
  bool onLoadingError{false};

  REACT_FIELD(onNavigationStateChange)
  bool onNavigationStateChange{false};

  const winrt::Microsoft::ReactNative::ViewProps ViewProps;
};

REACT_STRUCT(ExpoWindowsWebViewSpec_onNavigationStateChange)
struct ExpoWindowsWebViewSpec_onNavigationStateChange {
  REACT_FIELD(url)
  std::string url;

  REACT_FIELD(title)
  std::string title;

  REACT_FIELD(loading)
  bool loading{};

  REACT_FIELD(canGoBack)
  bool canGoBack{};

  REACT_FIELD(canGoForward)
  bool canGoForward{};
};

REACT_STRUCT(ExpoWindowsWebViewSpec_onLoadingError)
struct ExpoWindowsWebViewSpec_onLoadingError {
  REACT_FIELD(url)
  std::string url;

  REACT_FIELD(title)
  std::string title;

  REACT_FIELD(code)
  int32_t code{};

  REACT_FIELD(description)
  std::string description;
};

REACT_STRUCT(ExpoWindowsWebViewSpec_onLoadEnd)
struct ExpoWindowsWebViewSpec_onLoadEnd {
  REACT_FIELD(url)
  std::string url;

  REACT_FIELD(title)
  std::string title;

  REACT_FIELD(loading)
  bool loading{};

  REACT_FIELD(canGoBack)
  bool canGoBack{};

  REACT_FIELD(canGoForward)
  bool canGoForward{};
};

REACT_STRUCT(ExpoWindowsWebViewSpec_onLoad)
struct ExpoWindowsWebViewSpec_onLoad {
  REACT_FIELD(url)
  std::string url;

  REACT_FIELD(title)
  std::string title;

  REACT_FIELD(loading)
  bool loading{};

  REACT_FIELD(canGoBack)
  bool canGoBack{};

  REACT_FIELD(canGoForward)
  bool canGoForward{};
};

REACT_STRUCT(ExpoWindowsWebViewSpec_onLoadStart)
struct ExpoWindowsWebViewSpec_onLoadStart {
  REACT_FIELD(url)
  std::string url;

  REACT_FIELD(title)
  std::string title;

  REACT_FIELD(loading)
  bool loading{};

  REACT_FIELD(canGoBack)
  bool canGoBack{};

  REACT_FIELD(canGoForward)
  bool canGoForward{};
};

REACT_STRUCT(ExpoWindowsWebViewSpec_onMessage)
struct ExpoWindowsWebViewSpec_onMessage {
  REACT_FIELD(url)
  std::string url;

  REACT_FIELD(title)
  std::string title;

  REACT_FIELD(data)
  std::string data;
};

struct ExpoWindowsWebViewEventEmitter {
  ExpoWindowsWebViewEventEmitter(const winrt::Microsoft::ReactNative::EventEmitter &eventEmitter)
      : m_eventEmitter(eventEmitter) {}

  using OnMessage = ExpoWindowsWebViewSpec_onMessage;
  using OnLoadStart = ExpoWindowsWebViewSpec_onLoadStart;
  using OnLoad = ExpoWindowsWebViewSpec_onLoad;
  using OnLoadEnd = ExpoWindowsWebViewSpec_onLoadEnd;
  using OnLoadingError = ExpoWindowsWebViewSpec_onLoadingError;
  using OnNavigationStateChange = ExpoWindowsWebViewSpec_onNavigationStateChange;

  void onMessage(OnMessage &&value) const {
    m_eventEmitter.DispatchEvent(L"message", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onLoadStart(OnLoadStart &&value) const {
    m_eventEmitter.DispatchEvent(L"loadStart", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onLoad(OnLoad &&value) const {
    m_eventEmitter.DispatchEvent(L"load", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onLoadEnd(OnLoadEnd &&value) const {
    m_eventEmitter.DispatchEvent(L"loadEnd", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onLoadingError(OnLoadingError &&value) const {
    m_eventEmitter.DispatchEvent(L"loadingError", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

  void onNavigationStateChange(OnNavigationStateChange &&value) const {
    m_eventEmitter.DispatchEvent(L"navigationStateChange", [value = std::move(value)](const winrt::Microsoft::ReactNative::IJSValueWriter writer) {
      winrt::Microsoft::ReactNative::WriteValue(writer, value);
    });
  }

 private:
  winrt::Microsoft::ReactNative::EventEmitter m_eventEmitter{nullptr};
};

template<typename TUserData>
struct BaseExpoWindowsWebView {

  virtual void UpdateProps(
    const winrt::Microsoft::ReactNative::ComponentView &/*view*/,
    const winrt::com_ptr<ExpoWindowsWebViewProps> &newProps,
    const winrt::com_ptr<ExpoWindowsWebViewProps> &/*oldProps*/) noexcept {
    m_props = newProps;
  }

  // UpdateLayoutMetrics will only be called if this method is overridden
  virtual void UpdateLayoutMetrics(
    const winrt::Microsoft::ReactNative::ComponentView &/*view*/,
    const winrt::Microsoft::ReactNative::LayoutMetrics &/*newLayoutMetrics*/,
    const winrt::Microsoft::ReactNative::LayoutMetrics &/*oldLayoutMetrics*/) noexcept {
  }

  // UpdateState will only be called if this method is overridden
  virtual void UpdateState(
    const winrt::Microsoft::ReactNative::ComponentView &/*view*/,
    const winrt::Microsoft::ReactNative::IComponentState &/*newState*/) noexcept {
  }

  virtual void UpdateEventEmitter(const std::shared_ptr<ExpoWindowsWebViewEventEmitter> &eventEmitter) noexcept {
    m_eventEmitter = eventEmitter;
  }

  // MountChildComponentView will only be called if this method is overridden
  virtual void MountChildComponentView(const winrt::Microsoft::ReactNative::ComponentView &/*view*/,
           const winrt::Microsoft::ReactNative::MountChildComponentViewArgs &/*args*/) noexcept {
  }

  // UnmountChildComponentView will only be called if this method is overridden
  virtual void UnmountChildComponentView(const winrt::Microsoft::ReactNative::ComponentView &/*view*/,
           const winrt::Microsoft::ReactNative::UnmountChildComponentViewArgs &/*args*/) noexcept {
  }

  // Initialize will only be called if this method is overridden
  virtual void Initialize(const winrt::Microsoft::ReactNative::ComponentView &/*view*/) noexcept {
  }

  // CreateVisual will only be called if this method is overridden
  virtual winrt::Microsoft::UI::Composition::Visual CreateVisual(const winrt::Microsoft::ReactNative::ComponentView &view) noexcept {
    return view.as<winrt::Microsoft::ReactNative::Composition::ComponentView>().Compositor().CreateSpriteVisual();
  }

  // FinalizeUpdate will only be called if this method is overridden
  virtual void FinalizeUpdate(const winrt::Microsoft::ReactNative::ComponentView &/*view*/,
                                        winrt::Microsoft::ReactNative::ComponentViewUpdateMask /*mask*/) noexcept {
  }

  // CreateAutomationPeer will only be called if this method is overridden
  virtual winrt::Windows::Foundation::IInspectable CreateAutomationPeer(const winrt::Microsoft::ReactNative::ComponentView & /*view*/,
                                        const winrt::Microsoft::ReactNative::CreateAutomationPeerArgs& /*args*/) noexcept {
    return nullptr;
  }

  // You must provide an implementation of this method to handle the "injectJavaScript" command
  virtual void HandleInjectJavaScriptCommand(std::string script) noexcept = 0;

  // You must provide an implementation of this method to handle the "postMessage" command
  virtual void HandlePostMessageCommand(std::string message) noexcept = 0;

  // You must provide an implementation of this method to handle the "reload" command
  virtual void HandleReloadCommand() noexcept = 0;

  // You must provide an implementation of this method to handle the "goBack" command
  virtual void HandleGoBackCommand() noexcept = 0;

  // You must provide an implementation of this method to handle the "goForward" command
  virtual void HandleGoForwardCommand() noexcept = 0;

  // You must provide an implementation of this method to handle the "stopLoading" command
  virtual void HandleStopLoadingCommand() noexcept = 0;

  // You must provide an implementation of this method to handle the "scrollTo" command
  virtual void HandleScrollToCommand(double x, double y, bool animated) noexcept = 0;

  void HandleCommand(const winrt::Microsoft::ReactNative::ComponentView &view, const winrt::Microsoft::ReactNative::HandleCommandArgs& args) noexcept {
    auto userData = view.UserData().as<TUserData>();
    auto commandName = args.CommandName();
    if (commandName == L"injectJavaScript") {
      std::string script;
      winrt::Microsoft::ReactNative::ReadArgs(args.CommandArgs(), script);
      userData->HandleInjectJavaScriptCommand(script);
      return;
    }

    if (commandName == L"postMessage") {
      std::string message;
      winrt::Microsoft::ReactNative::ReadArgs(args.CommandArgs(), message);
      userData->HandlePostMessageCommand(message);
      return;
    }

    if (commandName == L"reload") {

      userData->HandleReloadCommand();
      return;
    }

    if (commandName == L"goBack") {

      userData->HandleGoBackCommand();
      return;
    }

    if (commandName == L"goForward") {

      userData->HandleGoForwardCommand();
      return;
    }

    if (commandName == L"stopLoading") {

      userData->HandleStopLoadingCommand();
      return;
    }

    if (commandName == L"scrollTo") {
      double x;
double y;
bool animated;
      winrt::Microsoft::ReactNative::ReadArgs(args.CommandArgs(), x, y, animated);
      userData->HandleScrollToCommand(x, y, animated);
      return;
    }
  }

  const std::shared_ptr<ExpoWindowsWebViewEventEmitter>& EventEmitter() const { return m_eventEmitter; }
  const winrt::com_ptr<ExpoWindowsWebViewProps>& Props() const { return m_props; }

private:
  winrt::com_ptr<ExpoWindowsWebViewProps> m_props;
  std::shared_ptr<ExpoWindowsWebViewEventEmitter> m_eventEmitter;
};

template <typename TUserData>
void RegisterExpoWindowsWebViewNativeComponent(
    winrt::Microsoft::ReactNative::IReactPackageBuilder const &packageBuilder,
    std::function<void(const winrt::Microsoft::ReactNative::Composition::IReactCompositionViewComponentBuilder&)> builderCallback) noexcept {
  packageBuilder.as<winrt::Microsoft::ReactNative::IReactPackageBuilderFabric>().AddViewComponent(
      L"ExpoWindowsWebView", [builderCallback](winrt::Microsoft::ReactNative::IReactViewComponentBuilder const &builder) noexcept {
        auto compBuilder = builder.as<winrt::Microsoft::ReactNative::Composition::IReactCompositionViewComponentBuilder>();

        builder.SetCreateProps([](winrt::Microsoft::ReactNative::ViewProps props,
                              const winrt::Microsoft::ReactNative::IComponentProps& cloneFrom) noexcept {
            return winrt::make<ExpoWindowsWebViewProps>(props, cloneFrom); 
        });

        builder.SetUpdatePropsHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     const winrt::Microsoft::ReactNative::IComponentProps &newProps,
                                     const winrt::Microsoft::ReactNative::IComponentProps &oldProps) noexcept {
            auto userData = view.UserData().as<TUserData>();
            userData->UpdateProps(view, newProps ? newProps.as<ExpoWindowsWebViewProps>() : nullptr, oldProps ? oldProps.as<ExpoWindowsWebViewProps>() : nullptr);
        });

        compBuilder.SetUpdateLayoutMetricsHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                      const winrt::Microsoft::ReactNative::LayoutMetrics &newLayoutMetrics,
                                      const winrt::Microsoft::ReactNative::LayoutMetrics &oldLayoutMetrics) noexcept {
            auto userData = view.UserData().as<TUserData>();
            userData->UpdateLayoutMetrics(view, newLayoutMetrics, oldLayoutMetrics);
        });

        builder.SetUpdateEventEmitterHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     const winrt::Microsoft::ReactNative::EventEmitter &eventEmitter) noexcept {
          auto userData = view.UserData().as<TUserData>();
          userData->UpdateEventEmitter(std::make_shared<ExpoWindowsWebViewEventEmitter>(eventEmitter));
        });

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::FinalizeUpdate != &BaseExpoWindowsWebView<TUserData>::FinalizeUpdate) {
            builder.SetFinalizeUpdateHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     winrt::Microsoft::ReactNative::ComponentViewUpdateMask mask) noexcept {
            auto userData = view.UserData().as<TUserData>();
            userData->FinalizeUpdate(view, mask);
          });
        } 

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::UpdateState != &BaseExpoWindowsWebView<TUserData>::UpdateState) {
          builder.SetUpdateStateHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     const winrt::Microsoft::ReactNative::IComponentState &newState) noexcept {
            auto userData = view.UserData().as<TUserData>();
            userData->UpdateState(view, newState);
          });
        }

        builder.SetCustomCommandHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                          const winrt::Microsoft::ReactNative::HandleCommandArgs& args) noexcept {
          auto userData = view.UserData().as<TUserData>();
          userData->HandleCommand(view, args);
        });

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::MountChildComponentView != &BaseExpoWindowsWebView<TUserData>::MountChildComponentView) {
          builder.SetMountChildComponentViewHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                      const winrt::Microsoft::ReactNative::MountChildComponentViewArgs &args) noexcept {
            auto userData = view.UserData().as<TUserData>();
            return userData->MountChildComponentView(view, args);
          });
        }

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::UnmountChildComponentView != &BaseExpoWindowsWebView<TUserData>::UnmountChildComponentView) {
          builder.SetUnmountChildComponentViewHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                      const winrt::Microsoft::ReactNative::UnmountChildComponentViewArgs &args) noexcept {
            auto userData = view.UserData().as<TUserData>();
            return userData->UnmountChildComponentView(view, args);
          });
        }

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::CreateAutomationPeer != &BaseExpoWindowsWebView<TUserData>::CreateAutomationPeer) {
            builder.SetCreateAutomationPeerHandler([](const winrt::Microsoft::ReactNative::ComponentView &view,
                                     const winrt::Microsoft::ReactNative::CreateAutomationPeerArgs& args) noexcept {
            auto userData = view.UserData().as<TUserData>();
            return userData->CreateAutomationPeer(view, args);
          });
        } 

        compBuilder.SetViewComponentViewInitializer([](const winrt::Microsoft::ReactNative::ComponentView &view) noexcept {
          auto userData = winrt::make_self<TUserData>();
          if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::Initialize != &BaseExpoWindowsWebView<TUserData>::Initialize) {
            userData->Initialize(view);
          }
          view.UserData(*userData);
        });

        if CONSTEXPR_SUPPORTED_ON_VIRTUAL_FN_ADDRESS (&TUserData::CreateVisual != &BaseExpoWindowsWebView<TUserData>::CreateVisual) {
          compBuilder.SetCreateVisualHandler([](const winrt::Microsoft::ReactNative::ComponentView &view) noexcept {
            auto userData = view.UserData().as<TUserData>();
            return userData->CreateVisual(view);
          });
        }

        // Allow app to further customize the builder
        if (builderCallback) {
          builderCallback(compBuilder);
        }
      });
}

} // namespace winrt::ExpoWindows::Codegen

#endif // #ifdef RNW_NEW_ARCH
