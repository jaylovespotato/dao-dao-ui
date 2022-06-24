import { HandIcon, MinusSmIcon, PlusSmIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import { FC, useState } from 'react'
import { useRecoilValue } from 'recoil'

import { ConnectWalletButton, StakingModal } from '@dao-dao/common'
import { useTranslation } from '@dao-dao/i18n'
import {
  stakingLoadingAtom,
  useGovernanceTokenInfo,
  useStakingInfo,
  useWallet,
} from '@dao-dao/state'
import {
  BalanceCard,
  BalanceIcon,
  StakingMode,
  SuspenseLoader,
} from '@dao-dao/ui'
import {
  convertMicroDenomToDenomWithDecimals,
  formatPercentOf100,
} from '@dao-dao/utils'

import { ClaimsPendingList } from './ClaimsPendingList'
import { useDAOInfoContext } from './DAOPageWrapper'
import { Loader } from './Loader'

const InnerCw20StakedBalanceVotingPowerDisplay: FC = () => {
  const { t } = useTranslation()
  const { coreAddress } = useDAOInfoContext()
  const {
    governanceTokenInfo,
    governanceTokenMarketingInfo,
    walletBalance: unstakedGovTokenBalance,
  } = useGovernanceTokenInfo(coreAddress, { fetchWalletBalance: true })
  const {
    walletStakedValue,
    totalStakedValue,
    blockHeight,
    sumClaimsAvailable,
  } = useStakingInfo(coreAddress, {
    fetchWalletStakedValue: true,
    fetchTotalStakedValue: true,
    fetchClaims: true,
  })

  const { connected, refreshBalances } = useWallet()

  // Set to a StakingMode to display modal.
  const [showStakingMode, setShowStakingMode] = useState<StakingMode>()
  const stakingLoading = useRecoilValue(stakingLoadingAtom)

  if (!governanceTokenInfo || blockHeight === undefined) {
    throw new Error('Failed to load data.')
  }

  if (
    !connected ||
    unstakedGovTokenBalance === undefined ||
    walletStakedValue === undefined ||
    totalStakedValue === undefined
  ) {
    return <ConnectWalletButton />
  }

  const tokenImageUrl =
    !!governanceTokenMarketingInfo?.logo &&
    governanceTokenMarketingInfo.logo !== 'embedded' &&
    'url' in governanceTokenMarketingInfo.logo
      ? governanceTokenMarketingInfo.logo.url
      : undefined

  return (
    <>
      <div className="flex flex-col gap-2 items-stretch">
        {!unstakedGovTokenBalance &&
          !walletStakedValue &&
          !sumClaimsAvailable && (
            <p className="caption-text">{t('notAMember')}</p>
          )}
        {unstakedGovTokenBalance > 0 && walletStakedValue === 0 && (
          <BalanceCard
            buttonLabel={t('Stake tokens')}
            icon={<PlusSmIcon className="w-4 h-4" />}
            loading={stakingLoading}
            onClick={() => setShowStakingMode(StakingMode.Stake)}
            opaque
            title={t('notAMemberYet')}
          >
            <div className="flex flex-row gap-2 items-center mb-2">
              <BalanceIcon iconURI={tokenImageUrl} />

              <p className="font-bold">
                {convertMicroDenomToDenomWithDecimals(
                  unstakedGovTokenBalance,
                  governanceTokenInfo.decimals
                ).toLocaleString(undefined, {
                  maximumFractionDigits: governanceTokenInfo.decimals,
                })}{' '}
                ${governanceTokenInfo.symbol}
                <span className="ml-1 secondary-text">{t('unstaked')}</span>
              </p>
            </div>

            <p className="secondary-text">{t('stakeToJoinAndVote')}</p>
          </BalanceCard>
        )}
        {walletStakedValue > 0 && (
          <BalanceCard
            buttonLabel={t('Unstake tokens')}
            icon={<MinusSmIcon className="w-4 h-4" />}
            loading={stakingLoading}
            onClick={() => setShowStakingMode(StakingMode.Unstake)}
            title={t('Voting Power')}
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-row gap-2 items-center">
                <BalanceIcon iconURI={tokenImageUrl} />
                <p className="title-text">
                  {formatPercentOf100(
                    totalStakedValue
                      ? (walletStakedValue / totalStakedValue) * 100
                      : 0
                  )}
                  %
                </p>
              </div>

              <p className="ml-6 secondary-text">
                {t('tokensStaked', {
                  amount: convertMicroDenomToDenomWithDecimals(
                    walletStakedValue,
                    governanceTokenInfo.decimals
                  ).toLocaleString(undefined, {
                    maximumFractionDigits: governanceTokenInfo.decimals,
                  }),
                  tokenSymbol: governanceTokenInfo.symbol,
                })}
              </p>
            </div>
          </BalanceCard>
        )}
        {!!sumClaimsAvailable && (
          <BalanceCard
            buttonLabel={t('Claim tokens')}
            icon={<HandIcon className="w-4 h-4" />}
            loading={stakingLoading}
            onClick={() => setShowStakingMode(StakingMode.Claim)}
            title={t('yourTokensUnstaked', {
              tokenSymbol: governanceTokenInfo.symbol,
            })}
          >
            <div className="flex flex-row flex-wrap gap-2 items-center primary-text">
              <BalanceIcon iconURI={tokenImageUrl} />
              {convertMicroDenomToDenomWithDecimals(
                sumClaimsAvailable,
                governanceTokenInfo.decimals
              ).toLocaleString(undefined, {
                maximumFractionDigits: governanceTokenInfo.decimals,
              })}{' '}
              ${governanceTokenInfo.symbol}
            </div>
          </BalanceCard>
        )}
        {walletStakedValue > 0 && unstakedGovTokenBalance > 0 && (
          <BalanceCard
            buttonLabel={t('Stake tokens')}
            icon={<PlusSmIcon className="w-4 h-4" />}
            loading={stakingLoading}
            onClick={() => setShowStakingMode(StakingMode.Stake)}
            opaque
            title={t('couldHaveMoreVotingPower')}
          >
            <div className="flex flex-row gap-2 items-center mb-2">
              <BalanceIcon iconURI={tokenImageUrl} />

              <p className="font-bold">
                {convertMicroDenomToDenomWithDecimals(
                  unstakedGovTokenBalance,
                  governanceTokenInfo.decimals
                ).toLocaleString(undefined, {
                  maximumFractionDigits: governanceTokenInfo.decimals,
                })}{' '}
                ${governanceTokenInfo.symbol}
                <span className="ml-1 secondary-text">{t('unstaked')}</span>
              </p>
            </div>

            <p className="secondary-text">{t('stakeToIncreaseVotingPower')}</p>
          </BalanceCard>
        )}
      </div>

      <ClaimsPendingList onClaimAvailable={refreshBalances} />

      {showStakingMode !== undefined && (
        <StakingModal
          connectWalletButton={<ConnectWalletButton />}
          coreAddress={coreAddress}
          loader={<Loader />}
          mode={showStakingMode}
          onClose={() => setShowStakingMode(undefined)}
        />
      )}
    </>
  )
}

interface Cw20StakedBalanceVotingPowerDisplayProps {
  primaryText?: boolean
}

export const Cw20StakedBalanceVotingPowerDisplay: FC<
  Cw20StakedBalanceVotingPowerDisplayProps
> = ({ primaryText }) => {
  const { t } = useTranslation()

  return (
    <>
      <h2 className={clsx('mb-4', primaryText ? 'primary-text' : 'title-text')}>
        {t('yourVotingPower')}
      </h2>

      <SuspenseLoader fallback={<Loader className="mt-4 h-min" />}>
        <InnerCw20StakedBalanceVotingPowerDisplay />
      </SuspenseLoader>
    </>
  )
}