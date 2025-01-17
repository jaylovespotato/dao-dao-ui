import { IndexedTx } from '@cosmjs/stargate'
import { selectorFamily, waitForAll } from 'recoil'

import { CwCoreVersion, parseCoreVersion } from '@dao-dao/utils'

import { blockHeightTimestampSelector, cosmWasmClientSelector } from './chain'
import { CwCoreV0_1_0Selectors } from './clients'

export const contractInstantiateTimeSelector = selectorFamily<
  Date | undefined,
  string
>({
  key: 'contractInstantiateTime',
  get:
    (address: string) =>
    async ({ get }) => {
      const client = get(cosmWasmClientSelector)

      const events = await client.searchTx({
        tags: [{ key: 'instantiate._contract_address', value: address }],
      })
      if (events.length === 0) return

      return get(blockHeightTimestampSelector(events[0].height))
    },
})

export const contractAdminSelector = selectorFamily<string | undefined, string>(
  {
    key: 'contractAdmin',
    get:
      (address: string) =>
      async ({ get }) => {
        const client = get(cosmWasmClientSelector)

        try {
          const contract = await client.getContract(address)
          return contract.admin
        } catch (_) {
          return undefined
        }
      },
  }
)

export interface TreasuryTransaction {
  tx: IndexedTx
  timestamp: Date | undefined
  events: {
    type: string
    attributes: {
      key: string
      value: string
    }[]
  }[]
}

export const treasuryTransactionsSelector = selectorFamily({
  key: 'treasuryTransactions',
  get:
    (address: string) =>
    async ({ get }) => {
      const client = get(cosmWasmClientSelector)

      const txs = await client.searchTx({
        sentFromOrTo: address,
      })

      const txDates = get(
        waitForAll(
          txs.map(({ height }) => blockHeightTimestampSelector(height))
        )
      )

      return (
        txs
          .map((tx, index) => {
            let events
            try {
              events = JSON.parse(tx.rawLog)[0].events
            } catch {
              return
            }

            return {
              tx,
              timestamp: txDates[index],
              events,
            }
          })
          .filter(Boolean) as TreasuryTransaction[]
      ).sort((a, b) =>
        // Sort descending by timestamp, putting undefined timestamps last.
        b.timestamp && a.timestamp
          ? b.timestamp.getTime() - a.timestamp.getTime()
          : !a.timestamp
          ? 1
          : !b.timestamp
          ? -1
          : 0
      )
    },
})

export const cwCoreVersionSelector = selectorFamily<CwCoreVersion, string>({
  key: 'cwCoreVersion',
  get:
    (coreAddress) =>
    async ({ get }) => {
      const coreInfo = get(
        CwCoreV0_1_0Selectors.infoSelector({ contractAddress: coreAddress })
      ).info

      const coreVersion = parseCoreVersion(coreInfo.version)
      if (!coreVersion) {
        throw new Error(
          `Failed parsing cw-core (${coreAddress}) version "${coreInfo.version}".`
        )
      }

      return coreVersion
    },
})
