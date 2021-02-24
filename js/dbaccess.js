/**
 * Classes for Data Caching in Browser
 */

class UIUtils {
  constructor() {

  }

  static updAutocomplete(symList, nodeID) {
    let parent = document.getElementById(nodeID);
    if (!parent) {
      return
    }

    //parent.options.length = 0;
    let autoList = symList.getAutocompleteList();
    console.log(autoList);
    for (const optVal of autoList) {
      let optNode = document.createElement("option");
      optNode.value = optVal;
      parent.appendChild(optNode);
      console.log(optNode);
    }
  }

  static updSelectDropdown(nodeID, iterOarr, datefmt = false, firstOptVal = null, firstOptText = null) {
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

    if (firstOptVal || firstOptText) {
      let firstNode = document.createElement("option");
      if (firstOptVal) {
        firstNode.value = firstOptVal;
      } else {
        firstNode.text = firstOptText;
      }
      if (firstOptText) {
        firstNode.text = firstOptText;
      } else {
        firstNode.text = firstOptVal;
      }

      if (preselect !== null && preselect === firstNode.value) {
        firstNode.selected = true;
      }

      select.appendChild(firstNode);
    }

    for (let i = 0; i < valArr.length; i++) {
      let optNode = document.createElement("option");
      let value = valArr[i].toString();
      optNode.value = value;
      if (datefmt) {
        optNode.text = value.substr(6, 2) + "-" + value.substr(4, 2) + "-" + value.substr(0, 4);
      } else {
        optNode.text = value;
      }

      if (preselect === null && i === 0) {
        optNode.selected = true;
      } else if (preselect !== null && preselect === optNode.value) {
        optNode.selected = true;
      }

      select.appendChild(optNode);
    }
  }

  static addSpinner(nodeID) {
    // nodeID is the node that is being updated currently
    // Spinner is added to the parent of this node
    const child = document.getElementById(nodeID);
    let parent = null;
    if (child.type === "button") {
      child.disabled = true;
      parent = child;
    } else {
      parent = child.parentElement;
    }

    const spinner = document.createElement('span');
    spinner.className = 'spinner-border spinner-border-sm ms-2';
    spinner.role = 'status';
    spinner.innerHTML = `<span class="visually-hidden" > Loading...</span >`;
    //parent.insertBefore(spinner, child);
    parent.appendChild(spinner);
  }

  static rmSpinner(nodeID) {
    const child = document.getElementById(nodeID);
    let parent = null;
    if (child.type === "button") {
      child.disabled = false;
      parent = child;
    } else {
      parent = child.parentElement;
    }

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

  static updateDatetimeSlider(sliderID, daysNodeID, singleThumb=false) {
    let rangeSlider = $("#" + sliderID).data('ionRangeSlider');
    //let dateRange = UIUtils.datetimeRange(daysNodeID);
    const select = document.getElementById(daysNodeID);
    const date = select.value.substr(0, 4) + "-" + select.value.substr(4, 2) + "-" + select.value.substr(6, 2);

    let thumbs = "double";
    if (singleThumb) {
      thumbs = "single";
    }

    //if (dateRange.min !== null && dateRange.min !== undefined) {
    let minDate = UIUtils.dateToTS(new Date(date + UIUtils.DAY_START));
    let maxDate = UIUtils.dateToTS(new Date(date + UIUtils.DAY_END));
    rangeSlider.update({
      type: thumbs,
      min: minDate,
      max: maxDate,
      from: minDate,
      to: maxDate
    });
    //}
  }

  static updateLists(cacheSyms, selectID, selectedVal, excNodeID, instNodeID,
    undNodeID, expNodeID, stkNodeID, cepeNodeID, daysNodeID, sliderNodeID, errAlertID, autocompNodeID = null, singleThumb=false) {
    let excSel, instSel, ulySel, leaf = [null, null, null, null];
    switch (selectID) {
      case excNodeID:
        let exc = selectedVal;
        UIUtils.updSelectDropdown(instNodeID, cacheSyms.getBs(exc));
        let inst = document.getElementById(instNodeID).options[0].text;
        UIUtils.updSelectDropdown(undNodeID, Array.from(cacheSyms.getCs(exc, inst), val => val.c));
        UIUtils.rmSpinner(instNodeID);
        selectedVal = inst;  // For the next case, we are not break-ing
      case instNodeID:
        if (selectedVal === "OPTIONS") {
          document.getElementById(expNodeID).disabled = false;
          document.getElementById(stkNodeID).disabled = false;
          document.getElementById(cepeNodeID).disabled = false;
        } else if (selectedVal === "FUTURES") {
          //document.getElementById(expNodeID).parentElement.parentElement.classList.remove("visually-hidden");
          //document.getElementById(stkNodeID).parentElement.parentElement.classList.add("visually-hidden");
          document.getElementById(expNodeID).disabled = false;
          let nd = document.getElementById(stkNodeID);
          nd.disabled = true; nd.options.length = 0;
          nd = document.getElementById(cepeNodeID);
          nd.disabled = true;
        } else if (selectedVal === "INDEX") {
          let nd = document.getElementById(expNodeID);
          nd.disabled = true; nd.options.length = 0;
          nd = document.getElementById(stkNodeID);
          nd.disabled = true; nd.options.length = 0;
          nd = document.getElementById(cepeNodeID);
          nd.disabled = true;
        }

        excSel = document.getElementById(excNodeID);
        UIUtils.updSelectDropdown(undNodeID, Array.from(cacheSyms.getCs(excSel.options[excSel.selectedIndex].text, selectedVal), val => val.c));
        UIUtils.rmSpinner(undNodeID);
        selectedVal = document.getElementById(undNodeID).options[0].text;
      case undNodeID:
        excSel = document.getElementById(excNodeID);
        instSel = document.getElementById(instNodeID);
        UIUtils.addSpinner(expNodeID);
        leaf = cacheSyms.getLeaf(excSel.options[excSel.selectedIndex].text, instSel.options[instSel.selectedIndex].text, selectedVal);
        DBFacade.fetchLists(leaf).then(data => {
          //console.log(data);
          if (data.days) {
            UIUtils.updSelectDropdown(daysNodeID, data.days, true);
            UIUtils.updateDatetimeSlider(sliderNodeID, daysNodeID, singleThumb);
          }
          if (data.exps) {
            UIUtils.updSelectDropdown(expNodeID, data.exps, true);
            UIUtils.updateLists(cacheSyms, expNodeID, data.exps[0], excNodeID, instNodeID,
              undNodeID, expNodeID, stkNodeID, cepeNodeID, daysNodeID, sliderNodeID, errAlertID, autocompNodeID);
          }
          UIUtils.rmSpinner(expNodeID);
        }).catch(error => {
          console.log(error);
          UIUtils.rmSpinner(expNodeID);
          UIUtils.showAlert(errAlertID, error);
        });

        break;
      case expNodeID:
        excSel = document.getElementById(excNodeID);
        instSel = document.getElementById(instNodeID);
        ulySel = document.getElementById(undNodeID);

        UIUtils.addSpinner(stkNodeID);
        UIUtils.addSpinner(daysNodeID);
        leaf = cacheSyms.getLeaf(excSel.value, instSel.value, ulySel.value);

        DBFacade.fetchLists(leaf, selectedVal).then(data => {
          //console.log(data);
          if (data.days) {
            UIUtils.updSelectDropdown(daysNodeID, data.days, true);
          }
          if (data.stks) {
            UIUtils.updSelectDropdown(stkNodeID, data.stks, false, "all", "All Strikes");
          }
          UIUtils.updateLists(cacheSyms, daysNodeID, data.days[0], excNodeID, instNodeID,
            undNodeID, expNodeID, stkNodeID, cepeNodeID, daysNodeID, sliderNodeID, errAlertID, autocompNodeID);
          UIUtils.rmSpinner(stkNodeID);
          UIUtils.rmSpinner(daysNodeID);
          UIUtils.updateDatetimeSlider(sliderNodeID, daysNodeID, singleThumb);
          UIUtils.updAutocomplete(cacheSyms, autocompNodeID);
        }).catch(error => {
          console.log(error);
          UIUtils.rmSpinner(stkNodeID);
          UIUtils.rmSpinner(daysNodeID);
          UIUtils.showAlert(errAlertID, error);
        });
        break;
      case daysNodeID:
        UIUtils.updateDatetimeSlider(sliderNodeID, daysNodeID, singleThumb);
    }

  }

  static async getRecords(excNodeID, instNodeID, undNodeID, 
    expNodeID, stkNodeID, cepeNodeID, sliderNodeID, singleSlider=false) {

    let rangeSlider = $("#" + sliderNodeID).data('ionRangeSlider');

    let stkNode = document.getElementById(stkNodeID);
    let stks = [];
    
    if (stkNode.value == "all") {
      for (let i = 0; i < stkNode.options.length; i++) {
        if (stkNode.options[i].value !== stkNode.value) {
          stks.push(stkNode.options[i].value);
        }
      }
    } else {
      stks.push(stkNode.value);
    }

    let cepeNode = document.getElementById(cepeNodeID);
    let cepe = [cepeNode.value];
    if (cepeNode.value == "Both") {
      cepe = ["CE", "PE"];
    }

    if (singleSlider) {
      return DBFacade.fetchRecs(document.getElementById(excNodeID).value, document.getElementById(instNodeID).value,
        document.getElementById(undNodeID).value, document.getElementById(expNodeID).value,
        [Math.floor(rangeSlider.result.from / 60000) * 60], stks, cepe, null, null
      );
    } else {
      return DBFacade.fetchRecs(document.getElementById(excNodeID).value, document.getElementById(instNodeID).value,
        document.getElementById(undNodeID).value, document.getElementById(expNodeID).value,
        null, stks, cepe, Math.floor(rangeSlider.result.from / 60000) * 60, Math.floor(rangeSlider.result.to / 60000) * 60
      );
    }
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

class DataTable {
  constructor() {
    
  }

  createTableRow(cols, elem = "td") {
    // Returns a tr Node object
    let row = document.createElement("tr");
    for (let i = 0; i < cols.length; i++) {
      let cell = document.createElement(elem);
      cell.innerHTML = cols[i];
      row.appendChild(cell);
    }

    return row;
  }

  loadStrategy(nodeID, stg) {
    const datatables = document.getElementById(nodeID);
    while (datatables.hasChildNodes()) {
      datatables.removeChild(datatables.firstChild);
    }

    const table = document.createElement("table");
    table.className = "table caption-top table-sm table-bordered";
    table.style = "{ empty-cells: show; }";

    const caption = document.createElement("caption");
    caption.className = "text-center";
    caption.innerHTML = "<strong>" + stg.name + "</strong> created at <strong>" + new Date(stg.time).toString() + "</strong> Value :" + stg.value;
    table.appendChild(caption);

    const head = document.createElement("thead");
    head.appendChild(this.createTableRow(["time", "Leg", "Exp", "Qty", "Open", "Price", "Value", "Cur Price", "Cur Value"], "th"));
    table.appendChild(head);

    const body = document.createElement("tbody");

    let count = stg.count;
    for (let i = 0; i < count; i++) {
      let leg = stg.legs[i];
      let rowData = [];

      let name = leg.c;
      if (leg.stk) {
        name += " " + leg.stk;
        name += " " + leg.cepe;
      }

      rowData.push(leg.timestamp);
      rowData.push(name);
      rowData.push(leg.exp);
      rowData.push(leg.isBuy ? leg.lots : -leg.lots);
      rowData.push(leg.isOpen ? "Open" : "Close");
      rowData.push(leg.price);
      rowData.push(leg.value);
      rowData.push(leg.curPrice);
      rowData.push(leg.curValue);

      body.appendChild(this.createTableRow(rowData));
    }

    table.appendChild(body);
    datatables.appendChild(table);
  }

  loadTable(nodeID, records) {
    const datatables = document.getElementById(nodeID);
    while (datatables.hasChildNodes()) {
      datatables.removeChild(datatables.firstChild);
    }

    const nodata = "";
    const tods = records.tods;

    if (records.sym.isOption) {
      const chainMap = records.objects;

      for (let i = 0; i < tods.length; i++) {
        const chain = chainMap.get(tods[i]);
        const table = document.createElement("table");
        table.className = "table caption-top table-sm table-bordered";
        table.style = "{ empty-cells: show; }";

        const caption = document.createElement("caption");
        caption.className = "text-center";
        caption.innerHTML = "<strong>" + chain.sym.c + "</strong> Chain Snapshot at <strong>" + new Date(parseInt(chain.tod) * 1000).toString() + "</strong>";
        table.appendChild(caption);

        const head = document.createElement("thead");
        head.appendChild(this.createTableRow(["OI", "LTP", "Strike Price", "LTP", "OI"], "th"));
        table.appendChild(head);

        const body = document.createElement("tbody");

        const sortedStrikes = chain.getStrikes();
        for (let j = 0; j < sortedStrikes.length; j++) {
          let pair = chain.getPair(sortedStrikes[j]);
          let rowData = [];
          if (pair.ce) {
            if (pair.ce.fs) {
              let t = pair.ce.fs[0].o;
              rowData.push(t ? t : nodata);
              t = pair.ce.fs[0].p;
              rowData.push(t ? t : nodata);
            } else {
              rowData.push(nodata, nodata);
            }
          } else {
            rowData.push(nodata, nodata);
          }

          rowData.push(sortedStrikes[j]);

          if (pair.pe) {
            if (pair.pe.fs) {
              let t = pair.pe.fs[0].p;
              rowData.push(t ? t : nodata);
              t = pair.pe.fs[0].o;
              rowData.push(t ? t : nodata);
            } else {
              rowData.push(nodata, nodata);
            }
          } else {
            rowData.push(nodata, nodata);
          }

          body.appendChild(this.createTableRow(rowData));
        }

        table.appendChild(body);
        datatables.appendChild(table);
      }
    } else {
      const objects = records.objects;

      const table = document.createElement("table");
      table.className = "table caption-top table-sm table-bordered";
      table.style = "{ empty-cells: show; }";

      const caption = document.createElement("caption");
      caption.className = "text-center";
      caption.innerHTML = "<strong>" + records.sym.c + "</strong> Snapshots";
      table.appendChild(caption);

      const head = document.createElement("thead");
      head.appendChild(this.createTableRow(["Date-Time", "Close", "Volume"], "th"));
      table.appendChild(head);

      const body = document.createElement("tbody");
      for (let i = 0; i < tods.length; i++) {
        const todrec = objects.get(tods[i]);     // One record per ts

        if (todrec.C) {
          body.appendChild(this.createTableRow([new Date(parseInt(todrec.tod) * 1000).toString(), todrec.C, todrec.V]));
        }
      }

      table.appendChild(body);
      datatables.appendChild(table);
    }
  }
}

class Strategy {
  constructor(name) {
    this._name = name;
    this._tmstmp = Date.now();
    this._legs = [];
  }

  get name() {
    return this._name;
  }

  get time() {
    return this._tmstmp;
  }

  add(leg, settle = false) {
    // Returns true when settled or added successfully
    for (let i = 0; i < this._legs.length; i++) {
      if (leg.matches(this._legs[i])) {
        if (settle) {
          if (this._legs[i].settleWith(leg)) {
            return true;
          } else {
            console.log("Settlement failed");
            return false;
          }
        } else {
          console.log("Match found, settlement not requested");
          return false;
        }
      }
    }

    this._legs.push(leg);
    return true;
  }

  get count() {
    return this._legs.length;
  }
  get legs() {
    return this._legs;
  }

  get value() {
    let total = 0;
    for (let i = 0; i < this._legs.length; i++) {
      total += this._legs[i].value;
    }

    return total;
  }

  async updateEarnings(tmstmp, resolve, reject) {
    const promises = [];
    for (let i = 0; i < this._legs.length; i++) {
      promises.push(this._legs[i].fetchNCalcEarnings(tmstmp));
    }

    Promise.allSettled(promises).then((results) => {
      let curValue = 0;
      let failure = false;
      let reasons = [];
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === "rejected") {
          reasons.push(results[i].reason);
          failure = true;
        }
      }

      if (failure) {
        reject(reasons);
      } else {
        for (let i = 0; i < results.length; i++) {
          if (results[i].status === "fulfilled") {
            curValue += results[i].value;
          }
        }

        resolve(curValue);
      }
    });
  }
}

LOT_SIZE = {
  VK349: 25,
  IMRO45: 75,
  RP17: 40
};

class StrategyLeg {
  constructor(sym, exp, bs, qty, prc, tmstmp=null, stk=null, cepe=null) {
    this._a = sym.a;
    this._b = sym.b;
    this._c = sym.c;
    this._e = exp;
    this._s = stk;
    this._cp = cepe;

    this._buy = "BUY" === bs;  // If not BUY, it's a SELL
    this._prc = prc;           // Price per share (needs to mul by lot size)
    this.lots = qty;
    
    this._opt = sym.isOption;  // Only Futures & Options

    this.timestamp = tmstmp;
    
    this._open = this.lots > 0 ? true : false;

    this.curPrice = prc;

    this._stllegs = [];      // Settlement Legs
  }

  get isOpen() {
    return this._open;
  }

  get isClosed() {
    return !this.isOpen;
  }

  get isBuy() {
    return this._buy;
  }

  get lots() {
    return this._q;
  }

  set lots(val) {
    this._q = val;
    this._tq = this._q * LOT_SIZE[this._c];
    this._val = this._tq * this._prc;
  }

  get tqty() {
    return this._tq;
  }

  get price() {
    return this._prc;
  }

  set price(val) {
    this._prc = val;
    this._val = this.tqty * this._prc;
  }

  get curPrice() {
    return this._curPrc;
  }

  set curPrice(val) {
    this._curPrc = val;
    this._curVal = this.tqty * this._curPrc;
  }

  get value() {
    for (let i = 0; i < this._stllegs.length; i++) {

    }
    return this.isBuy ? (-this._val) : this._val;
  }

  get curValue() {
    return this.isBuy ? (-this._curVal) : this._curVal;
  }

  get isOption() {
    return this._opt;
  }

  get isFuture() {
    return !this._opt;
  }

  get a() {
    return this._a;
  }

  get b() {
    return this._b;
  }

  get c() {
    return this._c;
  }

  get exp() {
    return this._e;
  }

  get stk() {
    return this._s;
  }

  get cepe() {
    return this._cp;
  }

  get timestamp() {
    return this._tm.getTime();
  }

  set timestamp(val) {
    if (!val) {
      this._tm = new Date();
    } else {
      this._tm = new Date(val);
    }
  }

  calcEarnings(newPrc) {    // New Price at which we do the opposite transaction
    let newValue = this.isBuy ? (-this.tqty * newPrc) : this.tqty * newPrc;

    return this.value - newValue;
  }

  matches(leg) {
    // Returns true if this matches leg based on option/future attributes (not bs/qty/prc)
    if (this.a === leg.a && this.b === leg.b && this.c === leg.c &&
      this.exp === leg.exp && this.stk === leg.stk && this.cepe == leg.cepe) {
      return true;
    }

    return false;
  }

  settleWith(leg) {
    // Returns true if settlement done else false (no change made)
    if (this.isClosed) {
      return false;
    }

    if (this.matches(leg) && this.isBuy !== leg.isBuy) {
      this._stllegs.push(leg);
      if (this.lots === leg.lots) {
        this._open = false;
      }
    } else {
      return false;
    }
  }

  async fetchNCalcEarnings(tmstmp = Date.now()) {
    let resp = await this.getRecord(tmstmp);
    let rec = new Record(resp[0]);
    this.curPrice = rec.ltp;
    return this.calcEarnings(rec.ltp);
  }

  async getRecord(tmstmp=Date.now(), endtm = null) {    // Javascript uses msec precision
    // Round the timestamps to minute boundary.
    if (endtm) {
      return DBFacade.fetchRecs(this.a, this.b, this.c, this.exp,
        null, [this.stk], [this.cepe], [Math.floor(tmstmp / 60000) * 60], [Math.floor(endtm / 60000) * 60]);
    } else {
      return DBFacade.fetchRecs(this._a, this._b, this.c, this.exp,
        [Math.floor(tmstmp / 60000) * 60], [this.stk], [this.cepe], null, null);
    }
  }
}

class RecordList {
  constructor(sym, recs) {
    if (typeof (recs) === "string") {
      recs = JSON.parse(recs);
    }

    this._sym = sym;
    let records = [];
    for (let i = 0; i < recs.length; i++) {
      records.push(new Record(recs[i]));
    }

    this.process(records);
  }

  get sym() {
    return this._sym;
  }

  get raw() {
    return this._raw;
  }

  get objects() {
    return this._todrecs;
  }

  get tods() {
    return Array.from(this._todrecs.keys()).sort();
  }

  process(recs) {
    this._raw = recs;
    this._todrecs = new Map();    // ts -> rec
    if (this.sym.isOption) {
      for (let i = 0; i < recs.length; i++) {
        let chain = this._todrecs.get(recs[i].tod);
        if (chain) {
          chain.add(recs[i]);
        } else {
          chain = new OptionChain(this.sym);
          chain.tod = recs[i].tod;
          chain.add(recs[i]);
          this._todrecs.set(recs[i].tod, chain);
        }
      }
    } else {
      for (let i = 0; i < recs.length; i++) {
        this._todrecs.set(recs[i].tod, recs[i]);
      }
    }
  }
}

class OptionChain {
  constructor(sym) {
    this._sym = sym;
    this._chain = new Map();  // Strike -> RecordPair
  }

  add(rec) {
    let pair = this._chain.get(rec.stk);
    if (pair) {
      // set other side of the pair
      pair.val = rec;
    } else {
      let pair = new RecordPair();
      pair.val = rec;
      this._chain.set(rec.stk, pair);
    }
  }

  get sym() {
    return this._sym;
  }

  get tod() {
    return this._tod;
  }

  set tod(val) {
    this._tod = val;
  }

  getStrikes() {
    return Array.from(this._chain.keys()).sort((a, b) => a - b);
  }

  getPair(stk) {
    return this._chain.get(stk);
  }
}

class RecordPair {
  constructor(ce=null, pe=null) {
    this._ce = ce;
    this._pe = pe;
  }

  set val(ce_pe) {
    if (ce_pe.opt === "CE") {
      this.ce = ce_pe;
    } else if (ce_pe.opt === "PE") {
      this.pe = ce_pe;
    }
  }

  get ce() {
    return this._ce;
  }

  set ce(val) {
    if (val) {
      this._ce = val;
      this._stk = val.stk;
    }
  }

  get pe() {
    return this._pe;
  }

  set pe(val) {
    if (val) {
      this._pe = val;
      this._stk = val.stk;
    }
  }

  get stk() {
    return this._stk;
  }
}

class Record {
  constructor(rec) {
    if (typeof (rec) === "string") {
      rec = JSON.parse(rec);
    }
    
    this.rec = rec;
    this.parse();
  }

  get tod() {
    return this._tod;
  }

  get stk() {
    return this._stk;
  }

  get opt() {
    return this._opt;
  }

  get O() {
    return this.rec.h[0];
  }

  get H() {
    return this.rec.h[1];
  }

  get L() {
    return this.rec.h[2];
  }

  get C() {
    return this.rec.h[3];
  }

  get V() {
    return this.rec.h[4];
  }

  get ltp() {
    let prc = null;
    let frms = this.fs;
    if (frms) {
      for (let i = 0; i < frms.length && frms[i].p; i++) {
        prc = frms[i].p;
      }
    }
    if (!prc && this.O) {
      prc = (this.O + this.H + this.L + this.C) / 4;
    }

    return prc;
  }

  get fs() {
    if (this._frms) {
      return this._frms;
    }

    if (this.rec.f) {
      let res = [];
      for (let i = 0; i < this.rec.f.length; i++) {
        res.push(new Frame(this.rec.f[i]));
      }

      return res;
    }
  }

  parse() {
    let idp = this.rec._id.split(":");
    this._tod = idp[0];
    if (idp.length > 1) {
      this._stk = idp[1];
      this._opt = idp[2];
    }

    this._frms = this.fs;
  }
}

class Frame {
  constructor(frm) {
    this.frm = frm;
  }

  get tod() {
    return this.frm.t;
  }

  get o() {
    return this.frm.o;
  }

  get p() {
    return this.frm.p;
  }

  get i() {
    return this.frm.i;
  }

  get c() {
    return this.frm.c;
  }

  get X() {
    return this.frm.x;
  }

  get O() {
    return this.frm.h[0];
  }

  get H() {
    return this.frm.h[1];
  }

  get L() {
    return this.frm.h[2];
  }

  get C() {
    return this.frm.h[3];
  }

  get V() {
    return this.frm.h[4];
  }
}

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
  }

  get isFuture() {
    if (this._exps && this._stks.size == 0) {
      return true;
    }
    return false;
    //return (this.b === "FUTURES")
  }

  get isOption() {
    if (this._exps && this._stks.size > 0) {
      return true;
    }
    return false;
    //return (this.b === "OPTIONS")
  }

  get isIndex() {
    if (!this._exps && this._stks.size == 0) {
      return true;
    }
    return false;
    //return (this.b === "INDEX")
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
        exp = exp.substr(6, 2) + exp.substr(4, 2) + exp.substr(0, 4);
        if (this.getStrikes(this.expiries[i])) {
          let stks = this.getStrikes(this.expiries[i]);
          for (let j = 0; j < stks.length; j++) {
            let key = this.c + " " + exp + " " + stks[i];
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

    return new Set(fullList.sort());
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
        sym.setStrikes(d, response.data().sort(function (a, b) { return a - b }));
      }

      if (sym.getDays(d) === null || sym.getDays(d) === undefined) {
        let response = await Fetcher.getDays(sym.a, sym.b, sym.c, d);
        sym.setDays(d, response.data().sort());
      }
    }

    return { stks: sym.getStrikes(d), days: sym.getDays(d) };
  }
}