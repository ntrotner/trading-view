import { Observable } from 'rxjs';

/**
 * Returns an operator that
 * converts asks and bids offers
 * to best sell and buy offer
 */
export function convertBuySell() {
  function getLowest(value: Array<string[]>) {
    let lowest = Infinity;
    value.forEach((value) => { if (lowest > Number(value[0])) { lowest = Number(value[0]); } });
    return lowest;
  }

  function getHighest(value: Array<string[]>) {
    let highest = 0;
    value.forEach((value) => { if (highest < Number(value[0])) { highest = Number(value[0]); } });
    return highest;
  }

  return function (source: Observable<{ asks: Array<string[]>, bids: Array<string[]> }>): Observable<{ buy: number | null, sell: number | null }> {
    return new Observable(subscriber => {
      source.subscribe({
        next(value) { if (value) { subscriber.next({ buy: getLowest(value.asks), sell: getHighest(value.bids) }); } },
        error(error) { subscriber.error([null, null]); },
        complete() { subscriber.complete(); }
      })
    });
  }
}