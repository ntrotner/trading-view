export interface portfolio {
  positions: position[];
  history: Array<{ date: Date, [key: string]: number | Date }>;
}

export interface position {
  id: string;
  amount: number;
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

  constructor(_positions?: position[]) {
    this.positions = _positions ? _positions : [];
    this.history = [];
  }
}
