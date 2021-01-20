export interface portfolio {
  positions: position[];
  history: Array<{ date: Date, [key: string]: number | Date }>;
  purchaseHistory: Array<purchase>;
}

export interface position {
  id: string;
  amount: number;
}

export interface purchase {
  from: string;
  to: string;
  rate: number;
  amount: number;
}

export class purchase {
  from: string;
  to: string;
  rate: number;
  amount: number;

  constructor(_from: string, _to: string, _rate: number, _amount: number) {
    this.from = _from;
    this.to = _to;
    this.rate = _rate;
    this.amount = _amount;
  }
}

export class position {
  id: string;
  amount: number;

  constructor(_id: string, _amount: number) {
    this.id = _id;
    this.amount = _amount;
  }
}

export class portfolio {
  public positions: position[];
  public history: Array<{ date: Date, [key: string]: number | Date }>;
  public purchaseHistory: Array<purchase>;

  constructor(_positions?: position[], _purchaseHistory?: Array<purchase>) {
    this.positions = _positions ? _positions : [];
    this.history = [];
    this.purchaseHistory = _purchaseHistory ? _purchaseHistory : [];
  }
}
