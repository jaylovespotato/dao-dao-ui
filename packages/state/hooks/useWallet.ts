import { useCallback, useEffect, useState } from 'react'

import { useRecoilValueLoadable, useSetRecoilState } from 'recoil'

import { getOfflineSignerAuto, isKeplrInstalled } from '@dao-dao/utils'

import {
  refreshWalletBalancesIdAtom,
  walletAccountNameSelector,
  walletAddressSelector,
  walletNativeBalanceSelector,
} from '../recoil'
import { keplrKeystoreIdAtom } from '../recoil/atoms/keplr'

export const useWallet = () => {
  const setKeplrKeystoreId = useSetRecoilState(keplrKeystoreIdAtom)
  const [error, setError] = useState<string>()

  // Wallet address
  const { state: walletAddressState, contents: walletAddressContents } =
    useRecoilValueLoadable(walletAddressSelector)
  const address =
    walletAddressState === 'hasValue' ? walletAddressContents : undefined
  // Wallet account name
  const { state: walletAccountNameState, contents: walletAccountNameContents } =
    useRecoilValueLoadable(walletAccountNameSelector)
  const name =
    walletAccountNameState === 'hasValue'
      ? walletAccountNameContents
      : undefined
  // Wallet balance
  const {
    state: walletNativeBalanceState,
    contents: walletNativeBalanceContents,
  } = useRecoilValueLoadable(walletNativeBalanceSelector)
  const nativeBalance =
    walletNativeBalanceState == 'hasValue'
      ? walletNativeBalanceContents
      : undefined

  const refreshConnection = useCallback(
    () => setKeplrKeystoreId((id) => id + 1),
    [setKeplrKeystoreId]
  )

  const disconnect = useCallback(
    () => setKeplrKeystoreId(-1),
    [setKeplrKeystoreId]
  )

  const connect = useCallback(async () => {
    // Set install message error if keplr not installed.
    if (!isKeplrInstalled()) {
      setKeplrKeystoreId(-1)
      return setError('Keplr is not installed.')
    }

    setError(undefined)

    // Attempt to connect and update keystore accordingly.
    try {
      await getOfflineSignerAuto()
      // If connection succeeds, propagate client to selector dependencies.
      refreshConnection()
    } catch (error) {
      console.error(error)
      setError(error instanceof Error ? error.message : `${error}`)

      // Set disconnected so we don't try to connect again without manual action.
      setKeplrKeystoreId(-1)
    }
  }, [setKeplrKeystoreId, setError, refreshConnection])

  // Listen for keplr keystore changes and update as needed.
  useEffect(() => {
    const keplrListener = () => {
      console.log('Keplr keystore changed, reloading client.')
      connect()
    }
    window.addEventListener('keplr_keystorechange', keplrListener)

    return () =>
      window.removeEventListener('keplr_keystorechange', keplrListener)
  }, [connect])

  const setRefreshWalletBalancesId = useSetRecoilState(
    refreshWalletBalancesIdAtom(address ?? '')
  )
  const refreshBalances = useCallback(
    () => setRefreshWalletBalancesId((id) => id + 1),
    [setRefreshWalletBalancesId]
  )

  return {
    connect,
    disconnect,
    refreshConnection,
    refreshBalances,
    error,
    address,
    name,
    nativeBalance,
    connected: !!address,
    installed: isKeplrInstalled(),
    loading: walletAddressState === 'loading',
  }
}
