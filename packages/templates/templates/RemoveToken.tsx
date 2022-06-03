import { useCallback, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import {
  constSelector,
  useRecoilValue,
  useRecoilValueLoadable,
  waitForAll,
} from 'recoil'

import { TokenInfoResponse } from '@dao-dao/state/clients/cw20-base'
import { allCw20TokenListSelector } from '@dao-dao/state/recoil/selectors/clients/cw-core'
import { tokenInfoSelector } from '@dao-dao/state/recoil/selectors/clients/cw20-base'
import { makeWasmMessage } from '@dao-dao/utils'

import {
  RemoveTokenComponent as StatelessRemoveTokenComponent,
  TemplateComponent,
  TemplateComponentLoader,
  UseDecodeCosmosMsg,
  UseTransformToCosmos,
} from '../components'

export interface RemoveTokenData {
  address: string
}

export const removeTokenDefaults = (): RemoveTokenData => ({
  address: '',
})

const InnerRemoveTokenComponent: TemplateComponent = (props) => {
  const { getLabel } = props

  const { watch, setError, clearErrors } = useFormContext()

  const tokenAddress = watch(getLabel('address'))
  const tokenInfoLoadable = useRecoilValueLoadable(
    tokenAddress
      ? tokenInfoSelector({ contractAddress: tokenAddress, params: [] })
      : constSelector(undefined)
  )

  useEffect(() => {
    if (tokenInfoLoadable.state === 'hasError') {
      setError(getLabel('address'), {
        type: 'manual',
        message: 'Failed to get token info.',
      })
    } else {
      clearErrors(getLabel('address'))
    }
  }, [tokenInfoLoadable, setError, clearErrors, getLabel])

  const existingTokenAddresses =
    useRecoilValue(
      allCw20TokenListSelector({
        contractAddress: props.coreAddress,
      })
    ) ?? []
  const existingTokenInfos =
    useRecoilValue(
      waitForAll(
        existingTokenAddresses.map((token) =>
          tokenInfoSelector({ contractAddress: token, params: [] })
        )
      )
    ) ?? []
  const existingTokens = existingTokenAddresses
    .map((address, idx) => ({
      address,
      info: existingTokenInfos[idx],
    }))
    // If undefined token info response, ignore the token.
    .filter(({ info }) => !!info) as {
    address: string
    info: TokenInfoResponse
  }[]

  return (
    <StatelessRemoveTokenComponent
      {...props}
      options={{
        existingTokens,
        loadingTokenInfo: tokenInfoLoadable.state === 'loading',
        tokenInfo:
          tokenInfoLoadable.state === 'hasValue'
            ? tokenInfoLoadable.contents
            : undefined,
      }}
    />
  )
}

export const RemoveTokenComponent: TemplateComponent = (props) => (
  <props.SuspenseLoader fallback={<TemplateComponentLoader />}>
    <InnerRemoveTokenComponent {...props} />
  </props.SuspenseLoader>
)

export const useTransformRemoveTokenToCosmos: UseTransformToCosmos<
  RemoveTokenData
> = (coreAddress: string) =>
  useCallback(
    (data: RemoveTokenData) =>
      makeWasmMessage({
        wasm: {
          execute: {
            contract_addr: coreAddress,
            funds: [],
            msg: {
              update_cw20_token_list: {
                to_add: [],
                to_remove: [data.address],
              },
            },
          },
        },
      }),
    []
  )

export const useDecodeRemoveTokenCosmosMsg: UseDecodeCosmosMsg<
  RemoveTokenData
> = (msg: Record<string, any>) =>
  'wasm' in msg &&
  'execute' in msg.wasm &&
  'update_cw20_token_list' in msg.wasm.execute.msg &&
  'to_add' in msg.wasm.execute.msg.update_cw20_token_list &&
  msg.wasm.execute.msg.update_cw20_token_list.to_add.length === 0 &&
  'to_remove' in msg.wasm.execute.msg.update_cw20_token_list &&
  msg.wasm.execute.msg.update_cw20_token_list.to_remove.length === 1
    ? {
        match: true,
        data: {
          address: msg.wasm.execute.msg.update_cw20_token_list.to_remove[0],
        },
      }
    : { match: false }