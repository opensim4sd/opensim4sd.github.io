import { apiLooper, constants, api, redirectTo } from 'helpers'
import config from 'app-config'
import actions from 'redux/actions'
import { getState } from 'redux/core'
import reducers from 'redux/core/reducers'


const broadcast = ({ sender, destination, amount, fee, rawTx, invoice }) => {
  const { user: { btcData } } = getState()

  const senderWallet = actions.btcmultisig.addressToWallet(sender)

  if (senderWallet) {
    const requestData = {
      address: btcData.address,
      pubkey: btcData.publicKey.toString('hex'),
      mainnet: (process.env.MAINNET) ? '1' : '0',

      sender,
      destination,
      amount,
      fee,
      rawTx,
      invoice,

      keys: senderWallet.publicKeys.map((key) => key.toString('hex')),
    }

    return apiLooper.post('multisig', `/broadcast/`, {
      body: requestData,
    }).then(({txId}) => {
      return txId
    })
  } else {
    console.error(`Btc-Multisig. Cant detect sender wallet`)
    return false
  }
}

const fetchTx = (txId) => apiLooper
  .get('multisig', `/tx/${txId}`)
  .then((txData) => txData)

const confirmTx = (address, msTxId, signedTx, txId) => {
  const senderWallet = actions.btcmultisig.addressToWallet(address)

  if (senderWallet) {
    return apiLooper.post('multisig', `/confirmtx/`, {
      body: {
        msTxId,
        keys: senderWallet.publicKeys.map((key) => key.toString('hex')),
        signedTx,
        txId,
      },
    }).then((data) => data)
  }
}

const rejectTx = (address, txId) => {
  const senderWallet = actions.btcmultisig.addressToWallet(address)

  if (senderWallet) {
    return apiLooper.post('multisig', `/rejecttx/`, {
      body: {
        txId,
        keys: senderWallet.publicKeys.map((key) => key.toString('hex')),
      },
    }).then((data) => data)
  }
}

const fetchRawTx = (address, txId) => {
  const senderWallet = actions.btcmultisig.addressToWallet(address)

  if (senderWallet) {
    return apiLooper.post('multisig', `/rawtx/`, {
      body: {
        txId,
        keys: senderWallet.publicKeys.map((key) => key.toString('hex')),
      },
    }).then((data) => data)
  }
}

const fetch = (address) => {
  const { user: { btcData } } = getState()
  const holderKey = btcData.publicKey.toString('hex')

  let firstPending = false
  let pengingCount = 0

  return apiLooper.post('multisig', `/txs/`, {
    body: {
      address,
    },
    query: 'multisigTx',
  }).then((res) => {
    if (res
      && res.answer
    ) {
      const senderWallet = actions.btcmultisig.addressToWallet(address)

      const transactions = res.items.map((item) => {
        let { status } = item

        switch(status) {
          case 1: status = 'pending'
            break;
          case 2: status = 'ready'
            break;
          case 3: status = 'reject'
            break;
          case 4: status = 'cancel'
            break;
        }

        // @ToDo - (draft) use api request for fetch status of address list
        if (status === 'pending' && holderKey !== item.holder) {
          firstPending = firstPending || {
            address,
            item,
          }
          pengingCount++
        }

        return ({
          type: 'btc',
          hash: item.uniqhash,
          canEdit: false,
          txType: 'CONFIRM',
          confirmTx: {
            ...item,
            status,
            isHolder: (holderKey === item.holder),
          },
          confirmations: 0,
          value: item.amount,
          date: item.utx * 1000,
          direction: 'out',
        })
      })

      // @ToDo - (draft) use api request for fetch status of address list
      reducers.user.updateMultisigStatus({
        address,
        last: firstPending,
        total: pengingCount,
      })
      return transactions
    } else return []
  }).catch ((e) => {
    return []
  })
}

const goToLastWallet = () => {
  const {
    user: {
      multisigStatus,
    }
  } = getState()

  const walletsWithRequests = Object.keys(multisigStatus).map((walletAddress) => ({
    walletAddress,
    ...multisigStatus[walletAddress],
  })).filter((item) => {
    const {
      count,
      pending,
    } = item

    return count
  })

  if (walletsWithRequests.length) {
    window.location.hash = `/btc/${walletsWithRequests[0].walletAddress}`
  }
}


export default {
  broadcast,
  fetch,

  fetchTx,
  fetchRawTx,
  confirmTx,
  rejectTx,

  goToLastWallet,
}