export interface bitstamp_channel_modify {
  event: string,
  data: {
    channel: string
  }
}

export interface bitstamp_channel_order_book_response {
  channel: string,
  data: { timestamp: string, microtimestamp: string, bids: Array<string[]>, asks: Array<string[]> },
  event: string
}