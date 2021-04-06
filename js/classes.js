/**
 * Classes for Data Retrieval
 */

class EntityFactory {
  static registry = new Map();
  constructor() {
  
  }

  static register(ver, cons) {
    EntityFactory.registry.set(ver, cons);
  }

  static isRegistered(jsonObj) {
    if (jsonObj.v) {
      return EntityFactory.registry.has(jsonObj.v);
    }

    return false;
  }

  static getEntity(jsonObj) {
    if (jsonObj.v) {
      const cons = EntityFactory.registry.get(jsonObj.v)
      return new cons().fromJSON(jsonObj);
    } else {
      throw new Error("Invalid JSON, not an Entity");
    }
  }
}

class Envelope {
  static ver = "env_0.0.1";  // v
  constructor() {
    this.dttm = null;        // d
    this.dev = null;         // e
    this.tk = null;          // k
    this.lc = null;          // l
    this.res = null;         // r
    this.apv = null;         // p
    this.aiv = null;         // i
    this.mid = null;         // m
    this.xid = null;         // x
    this.sid = null;         // s
    this.sta = null;         // a
    this.sdt = null;         // t
    this.tnt = null;         // n
    this.tcn = null;         // c
  }

  fromJSON(jsonObj) {

    this.dttm = jsonObj.d
    this.dev = jsonObj.e
    this.tk = jsonObj.k
    this.lc = jsonObj.l
    this.res = jsonObj.r
    this.apv = jsonObj.p
    this.aiv = jsonObj.i
    this.mid = jsonObj.m
    this.xid = jsonObj.x
    this.sid = jsonObj.s
    this.sta = jsonObj.a
    this.sdt = jsonObj.t
    this.tnt = jsonObj.n
    this.tcn = jsonObj.c

    return this;
  }

  toJSON() {
    let env = { v: Envelope.ver };
    env.d = Date.now();
    if (this.dev) {
      env.e = this.dev;
    }
    if (this.tk) {
      env.k = this.tk;
    }
    if (this.lc) {
      env.l = this.lc;
    }
    if (this.res) {
      env.r = this.res;
    }
    if (this.apv) {
      env.p = this.apv;
    }
    if (this.aiv) {
      env.i = this.aiv;
    }
    if (this.mid) {
      env.m = this.mid;
    }
    if (this.xid) {
      env.x = this.xid;
    }
    if (this.sid) {
      env.s = this.sid;
    }
    if (this.sta) {
      env.a = this.sta;
    }
    if (this.sdt) {
      env.t = this.sdt;
    }
    if (this.tnt) {
      env.n = this.tnt;
    }
    if (this.tcn) {
      env.c = this.tcn;
    }

    return env;
  }
}
EntityFactory.register(Envelope.ver, Envelope);

class Payload {
  static ver = "pay_0.0.1";  // v
  constructor() {

    this.opr = null;         // o
    this.cat = null;         // c: [string]
    this.flt = null;         // f: {}(string, any)
    this.fee = null;         // e
    this.ett = null;         // t : {ver}
    this.rec = null;         // r
    this.srt = null;         // s
    this.grp = null;         // g
  }

  fromJSON(jsonObj) {

    this.opr = jsonObj.o;
    this.cat = jsonObj.c;
    this.flt = jsonObj.f;
    this.fee = jsonObj.e;
    if (EntityFactory.isRegistered(jsonObj.t)) {
      this.ett = EntityFactory.getEntity(jsonObj.t);
    } else {
      this.ett = jsonObj.t;
    }
    this.rec = jsonObj.r;
    this.srt = jsonObj.s;
    this.grp = jsonObj.g;

    return this;
  }

  toJSON() {
    let pay = { v: Payload.ver };
    pay.o = this.opr;
    if (this.cat) {
      pay.c = this.cat;
    }
    if (this.flt) {
      pay.f = this.flt;
    }
    if (this.fee) {
      pay.e = this.fee;
    }
    pay.t = this.ett;
    if (this.rec) {
      pay.r = this.rec;
    }
    if (this.srt) {
      pay.s = this.srt;
    }
    if (this.grp) {
      pay.g = this.grp;
    }

    return pay;
  }
}
EntityFactory.register(Payload.ver, Payload);

class AggregatedPayload {
  static ver = "agp_0.0.1";  // v
  constructor() {
    this.pcm = null;         // p [{comps}]
  }

  fromJSON(jsonObj) {
    for (let i = 0; i < jsonObj.p.length; i++) {
      if (!this.pcm) {
        this.pcm = []
      }

      let comp = new AggregatedComponent();
      this.pcm.append(comp.fromJSON(jsonObj.p[i]));
    }
  }

  toJSON() {
    let pay = {};
    pay.v = AggregatedPayload.ver;
    if (this.pcm) {
      if (!pay.p) {
        pay.p = []
      }
      for (let i = 0; i < this.pcm.length; i++) {
        pay.p.append(this.pcm.toJSON());
      }
    }

    return pay;
  }
}
EntityFactory.register(AggregatedPayload.ver, AggregatedPayload);

class AggregatedComponent {
  static ver = "agc_0.0.1";  // v
  constructor() {
    this.res = null;         // r
    this.mid = null;         // m
    this.xid = null;         // x
    this.sta = null;         // a
    this.pld = null;         // y
    this.seq = null;         // q
    this.tk = null;          // k
    this.tcn = null;         // c
  }

  fromJSON(jsonObj) {

    this.res = jsonObj.r;
    this.mid = jsonObj.m;
    this.xid = jsonObj.x;
    this.sta = jsonObj.a;
    this.pld = jsonObj.y;
    this.seq = jsonObj.q;
    this.tk = jsonObj.k;
    this.tcn = jsonObj.c;

    return this;
  }

  toJSON() {
    let cmp = { v: AggregatedComponent.ver };
    if (this.res) {
      cmp.r = this.res;
    }
    if (this.mid) {
      cmp.m = this.mid;
    }
    if (this.xid) {
      cmp.x = this.xid;
    }
    if (this.sta) {
      cmp.a = this.sta;
    }
    if (this.pld) {
      env.y = this.pld;
    }
    if (this.seq) {
      env.q = this.seq;
    }
    if (this.tk) {
      cmp.k = this.tk;
    }
    if (this.tcn) {
      cmp.c = this.tcn;
    }

    return cmp;
  }
}
EntityFactory.register(AggregatedComponent.ver, AggregatedComponent);

class WebRequest {
  static ver = "wrq_1.0.0";
  // "exc"."inst", "sym", "exp", "stks:[]", "optys:[]", "dts:[]", "dtst", "dten"
  // "get": [exp | day | stk | rec], "view": viewname
  constructor() {
    this.env = new Envelope();
    this.pay = new Payload();
  }

  forXTM(exc, inst, sym) {
    if (!this.pay.flt) {
      this.pay.flt = {};
    }

    this.pay.flt["exc"] = exc;
    this.pay.flt["inst"] = inst;
    this.pay.flt["sym"] = sym;

    return this;
  }

  forExpiry(exp) {
    if (exp) {
      if (!this.pay.flt) {
        this.pay.flt = {};
      }

      this.pay.flt["exp"] = exp;
    }

    return this;
  }

  forDays(days) {
    if (days) {
      if (!this.pay.flt) {
        this.pay.flt = {};
      }
      this.pay.flt["dts"] = days.map(function (val) { return val.startLMinBSec });
    }

    return this;
  }

  forStrikes(stks) {
    if (stks) {
      if (!this.pay.flt) {
        this.pay.flt = {};
      }

      this.pay.flt["stks"] = stks;
    }

    return this;
  }

  forOptionTypes(optys) {
    if (optys) {
      if (!this.pay.flt) {
        this.pay.flt = {};
      }

      this.pay.flt["optys"] = optys;
    }

    return this;
  }

  forDateRange(range) {
    if (range) {
      if (!this.pay.flt) {
        this.pay.flt = {};
      }

      this.pay.flt["dtst"] = range.startLMinBSec;
      this.pay.flt["dten"] = range.endLMinBSec;
    }

    return this;
  }

  getXTM() {
    this.env.res = "/xtm";
    this.pay.opr = "get";
    this.pay.cat = ["xtm"];
    this.pay.ett = {"v":XTMEntity.ver};

    return this;
  }

  getExpiries() {
    this.env.res = "/data";
    this.pay.opr = "get";
    this.pay.cat = ["exp"];
    this.pay.ett = {"v":SymEntity.ver};

    return this;
  }

  getDays() {
    this.env.res = "/data";
    this.pay.opr = "get";
    this.pay.cat = ["day"];
    this.pay.ett = {"v":SymEntity.ver};

    return this;
  }

  getStrikes() {
    this.env.res = "/data";
    this.pay.opr = "get";
    this.pay.cat = ["stk"];
    this.pay.ett = {"v":SymEntity.ver};

    return this;
  }

  getRecords() {
    this.env.res = "/data";
    this.pay.opr = "get";
    this.pay.ett = {"v":RecEntity.ver};

    return this;
  }

  getView(name) {
    this.env.res = "/data";
    this.pay.opr = "get";
    this.pay.cat = [name];
    this.pay.ett = {"v":"view_1.0.0"};

    return this
  }

  toJSON() {
    return {
      "v" : WebRequest.ver,
      "e" : this.env,
      "y" : this.pay
    }
  }
}
EntityFactory.register(WebRequest.ver, WebRequest);

class WebResponse {
  static ver = "wrs_1.0.0";
  constructor(resp) {
    this.env = null;
    this.pay = null;
    this.req = null;
  }

  fromJSON(jsonObj) {
    this.env = EntityFactory.getEntity(jsonObj.e);
    this.pay = EntityFactory.getEntity(jsonObj.y);

    return this;
  }

  isSuccess() {
    return !this.env.sta;
  }

  setRequest(req) {
    this.req = req;
  }

  count() {
    if (this.pay.ett.length !== undefined) {
      return this.pay.ett.length;
    }

    return Object.keys(this.pay.ett).length;
  }

  data() {
    if (this.pay.ett) {
      delete this.pay.ett.v;
    }

    if (this.pay.ett.data !== undefined) {
      return this.pay.ett.data;
    }

    return this.pay.ett;
  }
}
EntityFactory.register(WebResponse.ver, WebResponse);

class RecEntity {
  static ver = "rec_1.0.0";
  constructor() {
    this.recs = null;
  }

  fromJSON(jsonObj) {
    this.recs = jsonObj.l;

    return this;
  }

  get length() {
    if (this.recs) {
      return this.recs.length;
    }
    
    return 0;
  }

  get data() {
    return this.recs;
  }

  toJSON() {
    //TODO, if required
  }
}
EntityFactory.register(RecEntity.ver, RecEntity);

class XTMEntity {
  static ver = "xtm_1.0.0";
  constructor() {
    this.recs = null;
  }

  fromJSON(jsonObj) {
    this.recs = jsonObj.d;

    return this;
  }

  get length() {
    Object.keys(this.recs).length;
  }

  get data() {
    return this.recs;
  }
}
EntityFactory.register(XTMEntity.ver, XTMEntity);

class SymEntity {
  static ver = "sym_1.0.0";
  constructor() {
    this.exp = null;
    this.day = null;
    this.stk = null;
  }

  fromJSON(jsonObj) {
    this.exp = jsonObj.exp;
    this.day = jsonObj.day;
    this.stk = jsonObj.stk;

    return this;
  }

  get length() {
    if (this.exp) {
      return this.exp.length;
    } else if (this.day) {
      return this.day.length;
    } else {
      return this.stk.length;
    }
  }

  get data() {
    if (this.exp) {
      return this.exp;
    } else if (this.day) {
      return this.day;
    } else {
      return this.stk;
    }
  }
}
EntityFactory.register(SymEntity.ver, SymEntity);

class WebError extends Error {
  constructor(sta) {
    if (typeof (sta) === "string") {
      super(sta)
      this.data = {
        code: 10000,
        msg: sta
      }
    } else {
      super(sta.msg)
      this.data = sta
    }
    this.name = "WebError";
  }

  code() {
    return this.data.code;
  }
}

class WebFactory {
  // For generating various kinds of requests
  //   Web API's Request objects
  static host = "/data";
  constructor() {

    if (!WebFactory.instance) {
      WebFactory.instance = this;
    }

    return WebFactory.instance;
  }

  getRequest(webreq) {
    // WebRequest -> Request
    let url = WebFactory.host;
    
    url += webreq.env.res;

    return new Request(url, {
      method: "POST",
      headers: {
        'Content-type': 'application/json'
      },
      redirect: 'manual',
      body: JSON.stringify(webreq)
    });

  }

  async getResponse(webreq, response) {
    // Response -> WebResponse / WebError
    if (response.ok) {
      const respObj = await response.json();
      const webresp = EntityFactory.getEntity(respObj);
      webresp.setRequest(webreq);

      if (webresp.isSuccess()) {
        return webresp;
      } else {
        throw new WebError(webresp.env.sta);        
      }
    } else {
      throw new WebError("Server Error [" + response.status + "]")
    }
  }
}

class Fetcher {
  constructor() {

  }

  static async get(webreq = null) {
    const factory = new WebFactory();
    if (!webreq) {
      webreq = new WebRequest();
    }

    const request = factory.getRequest(webreq);

    return await factory.getResponse(webreq, await fetch(request));
  }

  static async getXTM() {
    const webreq = new WebRequest().getXTM();
    return Fetcher.get(webreq);
  }

  static async getExpiries(exc, inst, sym) {
    const webreq = new WebRequest().forXTM(exc, inst, sym).getExpiries();
    return Fetcher.get(webreq);
  }

  static async getDays(exc, inst, sym, exp=null) {
    const webreq = new WebRequest().forXTM(exc, inst, sym).forExpiry(exp).getDays();
    return Fetcher.get(webreq);
  }

  static async getStrikes(exc, inst, sym, exp) {
    const webreq = new WebRequest().forXTM(exc, inst, sym).forExpiry(exp).getStrikes();
    return Fetcher.get(webreq);
  }

  static async getRecords(exc, inst, sym, exp, days = null, stks = null, optys = null, range = null) {
    if (range === null || range === undefined) {
      const webreq = new WebRequest().forXTM(exc, inst, sym).forExpiry(exp).forDays(days).forStrikes(stks).forOptionTypes(optys).getRecords();
      return Fetcher.get(webreq);
    } else {
      const webreq = new WebRequest().forXTM(exc, inst, sym).forExpiry(exp).forDateRange(range).forStrikes(stks).forOptionTypes(optys).getRecords();
      return Fetcher.get(webreq);
    }
  }
}