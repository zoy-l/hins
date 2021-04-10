import { Hins } from '../../../src/types'

export default (api: Hins) => {
  // @ts-expect-error test
  console.log(api.ApiInstance)
}
