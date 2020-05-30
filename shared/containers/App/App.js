import React, { Fragment } from "react";

import { withRouter, HashRouter } from "react-router-dom";
import PropTypes from "prop-types";
import actions from "redux/actions";
import { connect } from "redaction";
import moment from "moment-with-locales-es6";
import { constants, localStorage, firebase } from "helpers";
import { isMobile } from "react-device-detect";

import CSSModules from "react-css-modules";
import styles from "./App.scss";
import "scss/app.scss";

import { createSwapApp } from "instances/newSwap";
import Core from "containers/Core/Core";

import Header from "components/Header/Header";
import Footer from "components/Footer/Footer";
import Loader from "components/loaders/Loader/Loader";
import PreventMultiTabs from "components/PreventMultiTabs/PreventMultiTabs";
import RequestLoader from "components/loaders/RequestLoader/RequestLoader";
import ModalConductor from "components/modal/ModalConductor/ModalConductor";
import WidthContainer from "components/layout/WidthContainer/WidthContainer";
import Wrapper from "components/layout/Wrapper/Wrapper";
import NotificationConductor from "components/notification/NotificationConductor/NotificationConductor";
import Seo from "components/Seo/Seo";

import config from "helpers/externalConfig"

const memdown = require("memdown");

const userLanguage = (navigator.userLanguage || navigator.language || "en-gb").split("-")[0];
moment.locale(userLanguage);

@withRouter
@connect(({ currencies: { items: currencies }, modals, ui: { dashboardModalsAllowed } }) => ({
  currencies,
  isVisible: "loader.isVisible",
  ethAddress: "user.ethData.address",
  btcAddress: "user.btcData.address",
  tokenAddress: "user.tokensData.swap.address",
  modals,
  dashboardModalsAllowed,
}))
@CSSModules(styles, { allowMultiple: true })
export default class App extends React.Component {
  static propTypes = {
    children: PropTypes.element.isRequired
  };

  constructor() {
    super();

    this.localStorageListener = null;

    this.prvMultiTab = {
      reject: null,
      enter: null,
      switch: null
    };

    this.state = {
      fetching: false,
      multiTabs: false,
      error: ""
    };
    actions.user.getFiats()
  }


  generadeId(callback) {
    const newId = Date.now().toString();

    this.setState(
      {
        appID: newId
      },
      () => {
        callback(newId);
      }
    );
  }

  preventMultiTabs(isSwitch) {
    this.generadeId(newId => {
      if (isSwitch) {
        localStorage.setItem(constants.localStorage.switch, newId);
      }

      const onRejectHandle = () => {
        const { appID } = this.state;
        const id = localStorage.getItem(constants.localStorage.reject);

        if (id && id !== appID) {
          this.setState({ multiTabs: true });
          localStorage.unsubscribe(this.prvMultiTab.reject);
          localStorage.unsubscribe(this.prvMultiTab.enter);
          localStorage.unsubscribe(this.prvMultiTab.switch);
          localStorage.removeItem(constants.localStorage.reject);
        }
      };

      const onEnterHandle = () => {
        const { appID } = this.state;
        const id = localStorage.getItem(constants.localStorage.enter);
        const switchId = localStorage.getItem(constants.localStorage.switch);

        if (switchId && switchId === id) return;

        localStorage.setItem(constants.localStorage.reject, appID);
      };

      const onSwitchHangle = () => {
        const switchId = localStorage.getItem(constants.localStorage.switch);
        const { appID } = this.state;

        if (appID !== switchId) {
          this.setState({
            multiTabs: true
          });
          localStorage.unsubscribe(this.prvMultiTab.reject);
          localStorage.unsubscribe(this.prvMultiTab.enter);
          localStorage.unsubscribe(this.prvMultiTab.switch);
        }
      };

      this.prvMultiTab.reject = localStorage.subscribe(constants.localStorage.reject, onRejectHandle);
      this.prvMultiTab.enter = localStorage.subscribe(constants.localStorage.enter, onEnterHandle);
      this.prvMultiTab.switch = localStorage.subscribe(constants.localStorage.switch, onSwitchHangle);

      localStorage.setItem(constants.localStorage.enter, newId);
    });
  }

  componentWillMount() {
    const { currencies } = this.props;

    this.preventMultiTabs();

    const isWalletCreate = localStorage.getItem(constants.localStorage.isWalletCreate);

    if (!isWalletCreate) {
      if (config && config.isWidget) {
        currencies.forEach(({ name }) => {
          if (name !== "BTC" && !config.erc20[name.toLowerCase()]) {
            actions.core.markCoinAsHidden(name);
          }
        })
      } else {
        currencies.forEach(({ name }) => {
          if (name !== "BTC") {
            actions.core.markCoinAsHidden(name);
          }
        })
      }
    }

    if (!localStorage.getItem(constants.localStorage.demoMoneyReceived)) {
      actions.user.getDemoMoney();
    }

    firebase.initialize();
  }

  componentDidMount() {
    this.checkIfDashboardModalsAllowed()
    window.actions = actions;

    window.onerror = error => {
      // actions.analytics.errorEvent(error)
    };

    try {
      const db = indexedDB.open("test");
      db.onerror = () => {
        window.leveldown = memdown;
      };
    } catch (e) {
      window.leveldown = memdown;
    }

    actions.user.sign();
    createSwapApp();
    this.setState(() => ({ fetching: true }));

    window.prerenderReady = true;

    const appInstalled = (e) => {
      alert(
        userLanguage === 'ru'
          ? 'Подождите пока приложение устанавливается'
          : 'Wait while application is installing'
      )
      window.removeEventListener('appinstalled', appInstalled)
    }
    window.addEventListener('appinstalled', appInstalled)
  }

  componentDidUpdate() {
    this.checkIfDashboardModalsAllowed()
    if (process.env.MAINNET) {
      firebase.setUserLastOnline();
    }
  }

  checkIfDashboardModalsAllowed = () => {
    const dashboardModalProvider = document.querySelector('.__modalConductorProvided__')
    if (dashboardModalProvider && !this.props.dashboardModalsAllowed) {
      return actions.ui.allowDashboardModals()
    } else if (dashboardModalProvider && this.props.dashboardModalsAllowed) {
      return null
    }
    return actions.ui.disallowDashboardModals()
  }

  handleSwitchTab = () => {
    this.setState({
      multiTabs: false
    });
    this.preventMultiTabs(true);
  };

  overflowHandler = () => {
    const { modals, dashboardModalsAllowed } = this.props;
    const isAnyModalCalled = Object.keys(modals).length > 0
    if (typeof document !== 'undefined' && isAnyModalCalled && !dashboardModalsAllowed) {
      document.body.classList.remove('overflowY-default')
      document.body.classList.add('overflowY-hidden')
    } else {
      document.body.classList.remove('overflowY-hidden')
      document.body.classList.add('overflowY-default')
    }
    if (typeof document !== 'undefined' && isAnyModalCalled && dashboardModalsAllowed) {
      document.body.classList.remove('overflowY-dashboardView-default')
      document.body.classList.add('overflowY-dashboardView-hidden')
    } else {
      document.body.classList.remove('overflowY-dashboardView-hidden')
      document.body.classList.add('overflowY-dashboardView-default')
    }
  }

  render() {
    const { fetching, multiTabs, error } = this.state;
    const { children, ethAddress, btcAddress, tokenAddress, history, dashboardModalsAllowed } = this.props;

    this.overflowHandler()

    const isFetching = !ethAddress || !btcAddress || (!tokenAddress && config && !config.isWidget) || !fetching;

    const isWidget = history.location.pathname.includes("/exchange") && history.location.hash === "#widget";
    const isCalledFromIframe = window.location !== window.parent.location;
    const isWidgetBuild = config && config.isWidget;

    if (isWidgetBuild && localStorage.getItem(constants.localStorage.didWidgetsDataSend) !== "true") {
      firebase.submitUserDataWidget("usersData");
      localStorage.setItem(constants.localStorage.didWidgetsDataSend, true);
    }

    if (multiTabs) {
      return <PreventMultiTabs onSwitchTab={this.handleSwitchTab} />;
    }

    if (isFetching) {
      return <Loader showTips />;
    }

    const mainContent =
      (isWidget || isCalledFromIframe) && !isWidgetBuild ? (
        <Fragment>
          {children}
          <Core />
          <RequestLoader />
          {!dashboardModalsAllowed && <ModalConductor history={history} />}
          <NotificationConductor history={history} />
        </Fragment>
      ) : (
          <Fragment>
            <Seo location={history.location} />
            <Header />
            <Wrapper>
              <WidthContainer id="swapComponentWrapper" styleName="main">
                <main>{children}</main>
              </WidthContainer>
            </Wrapper>
            <Core />
            <Footer />
            <RequestLoader />
            {!dashboardModalsAllowed && <ModalConductor history={history} />}
            <NotificationConductor history={history} />
          </Fragment>
        );

    return <HashRouter>{mainContent}</HashRouter>;
  }
}
