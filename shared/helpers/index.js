import btc from './btc'
import eth from './eth'
import ethToken from './ethToken'
import user from './user'
import web3 from './web3'
import links from './links'
import request from './request'
import getCurrencyKey from './getCurrencyKey'
import constants from './constants'
import localStorage from './localStorage'
import api from './api'
import tips from './tips'
import * as utils from './utils'
// Methods
import ignoreProps from './ignoreProps'
import handleGoTrade from './handleGoTrade'
import firebase from './firebase'
// Getters
import externalConfig from './externalConfig'
import getPageOffset from './getPageOffset'
import getScrollBarWidth from './getScrollBarWidth'
import paddingForSwapList from './paddingForSwapList'
import estimateFeeValue from './estimateFeeValue'
import transactions from './transactions'

import { migrate } from './migrations/'

import getUnixTimeStamp from './getUnixTimeStamp'
import { cacheStorageGet, cacheStorageSet } from './cache'

import apiLooper from './apiLooper'


import metamask from './metamask'

import getWalletLink from './getWalletLink'

import redirectTo from './redirectTo'

export default {
  btc,
  eth,
  ethToken,
  getCurrencyKey,
  handleGoTrade,
  transactions,
  estimateFeeValue,
}

export {
  tips,
  btc,
  eth,
  ethToken,
  user,
  web3,
  utils,
  links,
  request,
  constants,
  localStorage,
  api,
  migrate,
  // Methods
  ignoreProps,
  handleGoTrade,
  firebase,

  // Getters
  getPageOffset,
  getScrollBarWidth,
  paddingForSwapList,
  externalConfig,


  getUnixTimeStamp,
  cacheStorageGet,
  cacheStorageSet,

  apiLooper,

  metamask,

  getWalletLink,

  redirectTo,

}
export { getItezUrl } from "./getItezUrl"
