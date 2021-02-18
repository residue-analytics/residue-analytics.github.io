/**
 * Classes for Data Caching in Browser
 */

class UIUtils {
  constructor() {

  }

  static updAutocomplete(symList, nodeID) {
    let parent = document.getElementById(nodeID);
    //parent.options.length = 0;
    for (const optVal of symList.getAutocompleteList()) {
      let optNode = document.createElement("option");
      optNode.value = optVal;
      parent.appendChild(optNode);
      console.log(optNode);
    }
  }

  static updSelectDropdown(nodeID, iterOarr, datefmt=false) {
    let select = document.getElementById(nodeID);
    let selOption = null;

    let valArr = iterOarr;
    if (!Array.isArray(iterOarr)) {
      valArr = Array.from(iterOarr);
    }

    let preselect = null;
    if (select.selectedIndex != -1) {
      preselect = select.options[select.selectedIndex].value;
    }

    select.options.length = 0;   // Remove all child option nodes
    for (let i = 0; i < valArr.length; i++) {
      let optNode = document.createElement("option");
      let value = valArr[i].toString();
      optNode.value = value;
      if (datefmt) {
        optNode.text = value.substr(6, 2) + "-" + value.substr(4, 2) + "-" + value.substr(0, 4);
      } else {
        optNode.text = value;
      }

      if (preselect === null && i == 0) {
        optNode.selected = true;
      } else if (preselect !== null && preselect === optNode.text) {
        optNode.selected = true;
      }

      select.appendChild(optNode);
    }
  }

  static addSpinner(nodeID) {
    // nodeID is the node that is being updated currently
    // Spinner is added to the parent of this node
    const child = document.getElementById(nodeID);
    const parent = child.parentElement;
    const spinner = document.createElement('div');
    spinner.className = 'spinner-border spinner-border-sm';
    spinner.role = 'status';
    spinner.innerHTML = `<span class="visually-hidden" > Loading...</span >`;
    //parent.insertBefore(spinner, child);
    parent.appendChild(spinner);
  }

  static rmSpinner(nodeID) {
    const parent = document.getElementById(nodeID).parentElement;
    const spinner = parent.querySelector('.spinner-border');
    if (spinner) {
      parent.removeChild(spinner);
    }
  }

  static showAlert(alertNodeID, message) {
    const parentDiv = document.getElementById(alertNodeID);
    const alert = document.createElement('div');
    alert.className = 'alert alert-warning alert-dismissible fade show';
    alert.role = 'alert';

    alert.innerHTML = '<strong>Holy guacamole!</strong> ' + message.toString() +
                       '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';

    parentDiv.appendChild(alert);
  }

  static updateDatetimeSlider(sliderID, daysNodeID) {
    let rangeSlider = $("#" + sliderID).data('ionRangeSlider');
    //let dateRange = UIUtils.datetimeRange(daysNodeID);
    const select = document.getElementById(daysNodeID);
    const date = select.value.substr(0, 4) + "-" + select.value.substr(4, 2) + "-" + select.value.substr(6, 2);

    //if (dateRange.min !== null && dateRange.min !== undefined) {
      let minDate = UIUtils.dateToTS(new Date(date + UIUtils.DAY_START));
      let maxDate = UIUtils.dateToTS(new Date(date + UIUtils.DAY_END));
      rangeSlider.update({
        min: minDate,
        max: maxDate,
        from: minDate,
        to: maxDate
      });
    //}
  }

  static datetimeRange(nodeID) {
    // Returns { min: .., max: .. }
    // Sorts the option.value and returns min and max (text, having ISO format date)
    const select = document.getElementById(nodeID);
    let min = null;
    let max = null;
    for (let i = 0; i < select.options.length; i++) {
      const value = select.options[i].value;
      const text = select.options[i].text;
      min = min === null ? value : min.localeCompare(value) < 0 ? min : value;
      max = max === null ? value : max.localeCompare(value) >= 0 ? max : value;
    }

    min = min.substr(0, 4) + "-" + min.substr(4, 2) + "-" + min.substr(6, 2);
    max = max.substr(0, 4) + "-" + max.substr(4, 2) + "-" + max.substr(6, 2);

    return { "min": min, "max": max };
  }

  static dateToTS(date) {
    return date.getTime();
  }

  static tsToDate(ts) {
    var d = new Date(ts);

    return d.toLocaleString("en-US", {dateStyle: "medium", timeStyle: "short"});
  }
}

UIUtils.DAY_START = "T09:15:00+05:30";
UIUtils.DAY_END = "T15:30:00+05:30";

class SymbolLeaf {
  constructor(a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;
    this._key = a + b + c;
    this._exps = null;
    this._stks = new Map();
    this._expDays = new Map();
    this._days = null;
  }

  get key() {
    return this._key;
  }

  get expiries() {
    return this._exps;
  }

  set expiries(val) {
    this._exps = val;
    console.log(this.key);
    console.log(val);
  }

  getStrikes(exp) {
    return this._stks.get(exp);
  }

  setStrikes(exp, val) {
    this._stks.set(exp, val);
  }

  getDays(exp = null) {
    if (exp === null || exp === undefined) {
      return this._days;
    } else {
      return this._expDays.get(exp);
    }
  }

  setDays(exp, val) {
    if (exp === null || exp == undefined) {
      this._days = val;
    } else {
      this._expDays.set(exp, val);
    }
  }

  getAutocompleteList() {
    let fullList = [];
    //console.log(this.key);
    //console.log(this.expiries);
    if (this.expiries) {
      for (let i = 0; i < this.expiries.length; i++) {
        let exp = this.expiries[i];
        console.log(exp);
        exp = exp.substr(6, 2) + exp.substr(4, 2) + exp.substr(0, 4);
        if (this.getStrikes(this.expiries[i])) {
          let stks = this.getStrikes(this.expiries[i]);
          for (let j = 0; j < stks.length; j++) {
            key = this.c + " " + exp + " " + stks[i];
            fullList.push(key + " CE");
            fullList.push(key + " PE");
          }
        } else {
          fullList.push(this.c + " " + exp);
        }
      }
    }
    
    return fullList;
  }
}

class SymbolList {
  constructor(tree) {
    this.aSet = new Set();
    this.bMap = new Map();
    this.cMap = new Map();
    this.load(tree);
  }

  getAs() {
    // Returns iterable object
    return this.aSet.keys();
  }

  getBs(a) {
    // Returns iterable object
    if (this.bMap.get(a) === undefined) {
      return null;
    }
    return this.bMap.get(a).keys();
  }

  getCs(a, b) {
    if (this.cMap.get(a + b) === undefined) {
      return null;
    }
    return this.cMap.get(a + b).values();
  }

  getLeaf(a, b, c) {
    let leaves = this.cMap.get(a + b);
    if (leaves) {
      for (let leaf of leaves) {
        if (leaf.c === c) {
          return leaf;
        }
      }
    }
  }

  getAutocompleteList() {
    let fullList = [];
    for (let leaves of this.cMap.values()) {
      for (let leaf of leaves) {
        let alist = leaf.getAutocompleteList();
        if (alist.length > 0) {
          fullList.concat(alist);
        }
      }
    }
    
    return new Set(fullList.sort()).keys();
  }

  load(tree) {
    for (let a in tree) {
      for (let b in tree[a]) {
        for (let i = 0; i < tree[a][b].length; i++) {
          this.aSet.add(a);    // Add only those for which we have leaves
          if (this.bMap.get(a) === undefined) {
            this.bMap.set(a, new Set().add(b));
          } else {
            this.bMap.get(a).add(b);
          }
          if (this.cMap.get(a + b) === undefined) {
            this.cMap.set( a + b, new Set().add(new SymbolLeaf(a, b, tree[a][b][i])) );
          } else {
            this.cMap.get(a + b).add(new SymbolLeaf(a, b, tree[a][b][i]));
          }
        }
      }
    }
  }
}

class DBOps {

  constructor(name) {
    this.name = name;
    this.db = new PouchDB(name, {revs_limit:5});
  }

  async destroy() {
    let resp = await this.db.destroy().catch(function (err) { throw new DBError("Unable to destroy [" + this.name + "]", err) });
    return resp.ok
  }

  async put(doc, pre = false) {
    // pre, ensures putting the doc with new revision when doc alread exists in DB

    if (doc === null || doc === undefined) {
      throw new DBError("Trying to save null");
    }

    if (typeof (doc) === "string") {
      doc = JSON.parse(doc);
    }

    if (pre) {
      // Pre-check whether record already exists
      if (doc._id) {
        const dbrec = await this.db.get(doc._id);
        if (dbrec) {
          console.log("document [" + doc._id + "] exists in DB [" + this.name + "], updating _rev [" + dbrec._rev + "]");
          doc["_rev"] = dbrec._rev;
        } else {
          console.log("document [" + doc._id + "] not exists in DB [" + this.name + "]");
        }
      }
    }

    let success = await this.db.put(doc).catch(function (err) {
      //console.log(err);
      throw new DBError("Unable to put [" + doc._id + "] status [" + err.status + "]", err);
    });

    //console.log(success);
    return success.ok;
  }

  async get(docId) {
    return await this.db.get(docId).catch(function (err) { throw new DBError("DB get [" + docId + "]", err) });
  }

  async delete(doc) {
    // We follow the recommended practice of adding _deleted : true to the doc
    //   in place of using db.remove(doc._id, doc._rev)

    if (doc === null || doc === undefined) {
      throw new DBError("Trying to save null");
    }

    if (typeof (doc) === "string") {
      doc = JSON.parse(doc);
    }

    if (!doc._id) {
      throw new DBError("Can't delete doc without _id");
    }

    if (doc._deleted === undefined || doc._deleted === null) {
      doc._deleted = true;
    }

    return await this.put(doc, true);
  }
}

class DBError extends Error {
  constructor(msg, err=null) {
    super(msg);
    this.err = err;
    this.name = "DBError";
  }
}

class DataDB {
  constructor() {

  }

  async fetch() {
    console.log("Cannot call Abstract DB.fetch()")
  }

  async fetchAll(start, end, b, c) {
    if (typeof (start) === "string") {
      start = Math.floor(Date.parse(start) / 60000) * 60;
    }

    if (typeof (end) === "string") {
      end = Math.floor(Date.parse(end) / 60000) * 60;
    }

    let result = []
    for (; start <= end; start += 60) {
      try {
        result.push(await this.fetch(start, b, c));
      } catch (err) {
        result.push(err);
      }
    }

    return result
  }
}

class OptionsDB extends DataDB {
  constructor(a, b, c, d) {
    super();
    this.db_name = a + b + c + "_" + d;
    this.db = new DBOps(this.db_name);
  }

  async save(doc) {
    return await this.db.put(doc);
  }

  async fetch(dttm, stks, opts) {
    if (typeof (dttm) === "string") {
      dttm = Math.floor(Date.parse(dttm) / 60000) * 60;    // msec -> sec & rounded to a minute
    }

    let result = [];
    for (let i = 0; i < stks.length; i++) {
      for (let j = 0; j < opts.length; j++) {
        let id = dttm.toString() + ":" + stks[i].toString() + ":" + opts[j];
        //console.log("Getting [" + id + "]");
        try {
          result.push(await this.db.get(id))
        } catch (err) {
          console.log("Caught and suppressed in OptionsDB fetch [" + err + "]")
          result.push(err);
        }
      }
    }

    return result
  }

  async fetchAll(start, end, stks, opts) {
    if (typeof (start) === "string") {
      start = Math.floor(Date.parse(start) / 60000) * 60;
    }

    if (typeof (end) === "string") {
      end = Math.floor(Date.parse(end) / 60000) * 60;
    }

    let result = [];
    for (; start <= end; start += 60) {
      result = result.concat(await this.fetch(start, stks, opts));
    }

    return result
  }
}

class FuturesDB extends DataDB {
  constructor(a, b, c, d) {
    super();
    this.db_name = a + b + c + "_" + d;
    this.db = new DBOps(this.db_name);
  }

  async save(doc) {
    return await this.db.put(doc);
  }

  async fetch(dttm, b, c) {
    if (typeof (dttm) === "string") {
      dttm = Math.floor(Date.parse(dttm) / 60000) * 60;    // msec -> sec & rounded to a minute
    }

    return await this.db.get(dttm.toString());
  }
}

class IndexDB extends DataDB {
  constructor(a, b, c) {
    super();
    this.db_name = a + b + c;
    this.db = new DBOps(this.db_name);
  }

  async save(doc) {
    return await this.db.put(doc);
  }

  async fetch(dttm, b, c) {
    if (typeof (dttm) === "string") {
      dttm = Math.floor(Date.parse(dttm) / 60000) * 60;    // msec -> sec & rounded to a minute
    }

    return await this.db.get(dttm.toString());
  }
}

class ListsDB {
  constructor() {
    this.db_name = "lists";
    this.db = new DBOps(this.db_name);
  }

  async save(doc) {

  }
}

class DBFactory {
  constructor() {

  }

  static create(a, b, c, d) {
    if ("OPTIONS" === b) {
      return new OptionsDB(a, b, c, d);
    } else if ("FUTURES" === b) {
      return new FuturesDB(a, b, c, d);
    } else if ("INDEX" === b) {
      return new IndexDB(a, b, c);
    } else {
      throw new DBError("Unknown DB Type");
    }
  }
}

class DBFacade {
  constructor() {

  }

  static async fetchNsave(db, a, b, c, d, e, f, g, h, i) {
    let data = await Fetcher.getRecords(a, b, c, d, e, f, g, h, i);
    if (data.count() > 0) {
      const recs = data.data();
      for (let i = 0; i < recs.length; i++) {
        await db.save(recs[i]).catch(error => { console.log("fetchNsave failed [" + error + "]") } );
      }

      return recs;
    }

    return [];
  }

  static async dbfetchNsave(db, a, b, c, d, e, f, g, h, i, recPush = true) {
    // recPush - push record on recs for Futures and Indexes
    //           concat (array of recs) on recs for Options
    let recs = [];
    if (e !== null && e !== undefined) {
      for (let i = 0; i < e.length; i++) {
        const dbRecs = await db.fetch(e[i], f, g).catch(error => {
          console.log("Fetching from catch [" + error + "]");
          return DBFacade.fetchNsave(db, a, b, c, d, e, f, g, h, i);
        });
        if (recPush) {
          recs.push(dbRecs);
        } else {
          recs = recs.concat(dbRecs);
        }
      }
    } else {
      recs = await db.fetchAll(h, i, f, g).catch(error => {
        console.log("Fetching from catch [" + error + "]");
        return DBFacade.fetchNsave(db, a, b, c, d, e, f, g, h, i);
      });
    }

    let badRecs = 0;
    if (recs && recs.length > 0) {
      for (let i = 0; i < recs.length; i++) {
        if (recs[i]._id === undefined || recs[i]._rev === undefined) {
          // Not a valid record from DB
          badRecs++;
        }
      }

      if (badRecs > recs.length / 10) {     // More than 10% bad records
        console.log("Too many bad records [" + badRecs + "]");
        return DBFacade.fetchNsave(db, a, b, c, d, e, f, g, h, i);
      } else {
        return recs;
      }
    } else {
      return DBFacade.fetchNsave(db, a, b, c, d, e, f, g, h, i);
    }
  }

  static async fetchRecs(a, b, c, d, e, f, g, h, i) {
    let db = DBFactory.create(a, b, c, d);
    let recs = [];
    if (f !== null && f !== undefined) {
      // Must be options
      return await DBFacade.dbfetchNsave(db, a, b, c, d, e, f, g, h, i, false);
    } else if (d != null && d != undefined) {
      // Futures
      return await DBFacade.dbfetchNsave(db, a, b, c, d, e, f, g, h, i, true);
    } else {
      // Index
      return await DBFacade.dbfetchNsave(db, a, b, c, d, e, f, g, h, i, true);
    }
  }

  static async fetchLists(sym = null, d = null) {
    if (sym === null) {
      let response = await Fetcher.getXTM();
      return new SymbolList(response.data()[0]);
    }

    if (d === null) {
      if (sym.expiries === null || sym.expiries === undefined) {
        if (sym.b === "INDEX") {
          if (sym.getDays() === null || sym.getDays() === undefined) {
            let response = await Fetcher.getDays(sym.a, sym.b, sym.c);
            sym.setDays(response.data().sort());
          }

          return { days: sym.getDays() };
        }

        let response = await Fetcher.getExpiries(sym.a, sym.b, sym.c);
        sym.expiries = response.data().sort();
      }

      return { exps: sym.expiries };
    }

    if (sym.getStrikes(d) === null || sym.getStrikes(d) === undefined) {
      if (sym.b === "OPTIONS") {
        let response = await Fetcher.getStrikes(sym.a, sym.b, sym.c, d);
        sym.setStrikes(d, response.data().sort());
      }

      if (sym.getDays(d) === null || sym.getDays(d) === undefined) {
        let response = await Fetcher.getDays(sym.a, sym.b, sym.c, d);
        sym.setDays(d, response.data().sort());
      }
    }

    return { stks: sym.getStrikes(d), days: sym.getDays(d) };
  }
}