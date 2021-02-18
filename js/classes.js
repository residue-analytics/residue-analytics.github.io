/**
 * Classes for Data Retrieval
 */

class WebRequest {
  // "exc"."inst", "sym", "exp", "stks:[]", "optys:[]", "dts:[]", "dtst", "dten"
  // "get": [exp | day | stk | rec]
  constructor() {
    this.get = null
  }

  forXTM(exc, inst, sym) {
    this.exc = exc
    this.inst = inst
    this.sym = sym

    return this
  }

  forExpiry(exp) {
    if (exp !== null && exp !== undefined) {
      this.exp = exp
    }

    return this
  }

  forDays(days) {
    if (days !== null && days !== undefined) {
      this.dts = days
    }

    return this
  }

  forStrikes(stks) {
    if (stks !== null && stks !== undefined) {
      this.stks = stks
    }

    return this
  }

  forOptionTypes(optys) {
    if (optys !== null && optys !== undefined) {
      this.optys = optys
    }

    return this
  }

  forDateRange(start, end) {
    if (start !== null && start !== undefined &&
        end !== null && end !== undefined) {
      this.dtst = start
      this.dten = end
    }

    return this
  }

  getXTM() {
    this.get = null
  }

  getExpiries() {
    this.get = "exp"

    return this
  }

  getDays() {
    this.get = "day"

    return this
  }

  getStrikes() {
    this.get = "stk"

    return this
  }

  getRecords() {
    this.get = "rec"

    return this
  }
}

class WebResponse {
  constructor(req, resp) {
    if (resp.data) {
      this.request = req
      this.response = resp
    } else {
      console.log(resp)
      throw new WebError("Invalid successful response object")
    }
  }

  count() {
    return this.response.count;
  }

  data() {
    return this.response.data;
  }
}

class WebError extends Error {
  constructor(obj) {
    if (typeof (obj) === "string") {
      super(obj)
      this.data = {
        code: 10000,
        msg: obj
      }
    } else {
      super(obj.msg)
      this.data = obj
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
  static host = "http://localhost/data";
  constructor() {

    if (!WebFactory.instance) {
      WebFactory.instance = this;
    }

    return WebFactory.instance;
  }

  getRequest(webreq) {
    // WebRequest -> Request
    let url = WebFactory.host;
    
    if (webreq.get === null || webreq.get === undefined) {
      url += "/xtm"
      return new Request(url, {
        method: "GET",
        redirect: 'manual'
      });
    } else {
      url += "/data"
      return new Request(url, {
        method: "POST",
        headers: {
          'Content-type': 'application/json'
        },
        redirect: 'manual',
        body: JSON.stringify(webreq)
      });
    }
  }

  async getResponse(webreq, response) {
    // Response -> WebResponse / WebError
    if (response.ok) {
      const respObj = await response.json();
      if (respObj.code !== 0) {
        throw new WebError(respObj);
      } else {
        return new WebResponse(webreq, respObj);
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
    if (webreq === null || webreq === undefined) {
      webreq = new WebRequest();
    }

    const request = factory.getRequest(webreq);

    return await factory.getResponse(webreq, await fetch(request));
  }

  static async getXTM() {
    return Fetcher.get();
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

  static async getRecords(exc, inst, sym, exp, days = null, stks = null, optys = null, start = null, end = null) {
    if (start === null || start === undefined) {
      const webreq = new WebRequest().forXTM(exc, inst, sym).forExpiry(exp).forDays(days).forStrikes(stks).forOptionTypes(optys).getRecords();
      return Fetcher.get(webreq);
    } else {
      const webreq = new WebRequest().forXTM(exc, inst, sym).forExpiry(exp).forDateRange(start, end).forStrikes(stks).forOptionTypes(optys).getRecords();
      return Fetcher.get(webreq);
    }
  }
}