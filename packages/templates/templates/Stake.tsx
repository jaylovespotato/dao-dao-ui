import { useCallback } from 'react'
import { useRecoilValue } from 'recoil'

import { nativeBalancesSelector } from '@dao-dao/state'
import {
  convertDenomToHumanReadableDenom,
  StakeType,
  convertMicroDenomToDenomWithDecimals,
  nativeTokenDecimals,
  NATIVE_DENOM,
  makeDistributeMessage,
  makeStakingMessage,
  convertDenomToMicroDenomWithDecimals,
} from '@dao-dao/utils'

import {
  stakeActions,
  StakeComponent as StatelessStakeComponent,
  TemplateComponent,
  TemplateComponentLoader,
  UseDecodeCosmosMsg,
  UseTransformToCosmos,
} from '../components'

export interface StakeData {
  stakeType: StakeType
  validator: string
  fromValidator?: string
  amount: number
  denom: string
}

export const stakeDefaults = (): StakeData => {
  const denom = convertDenomToHumanReadableDenom(NATIVE_DENOM)

  return {
    stakeType: stakeActions[0].type,
    validator: '',
    amount: 1,
    denom,
  }
}

const InnerStakeComponent: TemplateComponent = (props) => {
  const nativeBalances =
    useRecoilValue(nativeBalancesSelector(props.coreAddress)) ?? []

  return (
    <StatelessStakeComponent
      {...props}
      options={{
        nativeBalances,
      }}
    />
  )
}

export const StakeComponent: TemplateComponent = (props) => (
  <props.SuspenseLoader fallback={<TemplateComponentLoader />}>
    <InnerStakeComponent {...props} />
  </props.SuspenseLoader>
)

export const useTransformStakeToCosmos: UseTransformToCosmos<StakeData> = () =>
  useCallback((data: StakeData) => {
    if (data.stakeType === StakeType.WithdrawDelegatorReward) {
      return makeDistributeMessage(data.validator)
    }

    // NOTE: Does not support TOKEN staking at this point, however it could be implemented here!
    const decimals = nativeTokenDecimals(data.denom)!
    const amount = convertDenomToMicroDenomWithDecimals(data.amount, decimals)
    return makeStakingMessage(
      data.stakeType,
      amount,
      data.denom,
      data.validator,
      data.fromValidator
    )
  }, [])

export const useDecodeStakeCosmosMsg: UseDecodeCosmosMsg<StakeData> = (
  msg: Record<string, any>
) => {
  const denom = convertDenomToHumanReadableDenom(
    process.env.NEXT_PUBLIC_FEE_DENOM as string
  )

  if (
    'distribution' in msg &&
    StakeType.WithdrawDelegatorReward in msg.distribution &&
    'validator' in msg.distribution.withdraw_delegator_reward
  ) {
    return {
      match: true,
      data: {
        stakeType: StakeType.WithdrawDelegatorReward,
        validator: msg.distribution.withdraw_delegator_reward.validator,
        // Default values, not needed for displaying this type of message.
        amount: 1,
        denom,
      },
    }
  } else if ('staking' in msg) {
    const stakeType = stakeActions
      .map(({ type }) => type)
      .find((type) => type in msg.staking)
    if (!stakeType) return { match: false }

    const data = msg.staking[stakeType]
    if (
      ((stakeType === StakeType.Redelegate &&
        'src_validator' in data &&
        'dst_validator' in data) ||
        (stakeType !== StakeType.Redelegate && 'validator' in data)) &&
      'amount' in data &&
      'amount' in data.amount &&
      'denom' in data.amount
    ) {
      const { denom } = data.amount

      return {
        match: true,
        data: {
          stakeType,
          validator:
            stakeType === StakeType.Redelegate
              ? data.dst_validator
              : data.validator,
          fromValidator:
            stakeType === StakeType.Redelegate ? data.src_validator : undefined,
          amount: convertMicroDenomToDenomWithDecimals(
            data.amount.amount,
            nativeTokenDecimals(denom)!
          ),
          denom,
        },
      }
    }
  }

  return { match: false }
}