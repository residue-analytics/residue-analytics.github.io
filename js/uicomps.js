
class TradingInstrument {
  constructor(sym) {
    this._sym = sym;
  }

  async makeFuture(deferMonth=0) {
    // Create a Future Instrument based on this instrument and its simulation Date
    let futSym = globals.symbols.getLeaf(this.sym.a, "FUTURES", this.sym.c);
    if (!futSym) {
      return null;
    }

    await DBFacade.fetchLists(futSym);  // This will update the required data in sym
    
    let exp = futSym.getMonthlyExpiry(this.simulationDateYYYYMMDD, deferMonth);
    if (exp) {
      let futInst = new TradingInstrument(futSym);
      futInst.exp = exp;
      futInst.simulationTS = this.simulationTS;
      return futInst;
    }

    return null;
  }

  async makeIndex(idx=this.sym.c) {
    let idxSym = globals.symbols.getLeaf(this.sym.a, "INDEX", idx);
    if (!idxSym) {
      return null;
    }

    await DBFacade.fetchLists(idxSym);
    
    let idxInst = new TradingInstrument(idxSym);
    idxInst.simulationTS = this.simulationTS;

    return idxInst;
  }

  get sym() {
    return this._sym;
  }

  set exp(val) {
    this._exp = val;
    this._expDisp = val.substr(6, 2) + "-" + val.substr(4, 2) + "-" + val.substr(0, 4);
  }
  get exp() {  // YYYYMMDD
    return this._exp;
  }
  get expDisplay() {
    return this._expDisp
  }

  set stk(val) {
    this._stk = val;
  }
  get stk() {
    return this._stk;
  }

  set opt(val) {
    this._opt = val;
  }
  get opt() {
    return this._opt;
  }

  get isFuture() {
    return this.sym.b === "FUTURES";
  }

  get isOption() {
    return this.sym.b === "OPTIONS";
  }

  get isIndex() {
    return this.sym.b === "INDEX";
  }

  set simulationTS(val) {
    this._simDt = val;
  }
  get simulationTS() {
    return this._simDt;  // Number 
  }
  get simulationDate() {
    return new Date(this._simDt);
  }
  get simulationDateYYYYMMDD() {  // YYYYMMDD format (UTC)
    let dt = this.simulationDate;
    return dt.getUTCFullYear().toString() + ((dt.getUTCMonth() < 9) ? '0' + (dt.getUTCMonth() + 1) : (dt.getUTCMonth() + 1).toString()) + ((dt.getUTCDate() < 10) ? '0' + dt.getUTCDate() : dt.getUTCDate().toString());
  }

  isSame(other) {
    if (this.sym === other.sym) {  // No need to compare a, b & c. sym are global
      if (this.isIndex) {
        return true;
      }
      if (this.exp === other.exp) {
        if (this.isFuture) {
          return true;
        }
        if (this.stk === other.stk && this.opt === other.opt) {
          return true;
        }
      }
    }

    return false;
  }
}

class Trade {
  constructor(instrument, tod, isBuy, qty, prc) {
    this.inst = instrument;
    this.tod = tod;
    this.isBuy = isBuy;
    this.isSell = !this.isBuy;
    this.qty = qty;
    this.prc = prc;

    let dateObj = new Date(tod);
    this.day = dateObj.getFullYear().toString();
    this.day += (dateObj.getMonth() < 9) ? '0' + (dateObj.getMonth() + 1) : "" + (dateObj.getMonth() + 1);
    this.day += (dateObj.getDate() < 10) ? '0' + dateObj.getDate() : "" + dateObj.getDate();

    console.log(`Trade Day [${this.day}] Time [${this.tod}]`);
  }
}

class ResDataSelector {
  constructor(excID, instID, undID, expID, stkID, cepeID, daysID, dateSliderID, 
    timeSliderID, errID, dataRefreshCallback, disablePageCallback, enablePageCallback) {
    
    this.excID = excID;
    this.instID = instID;
    this.undID = undID;
    this.expID = expID;
    this.stkID = stkID;
    this.cepeID = cepeID;
    this.daysID = daysID;
    this.dateSliderID = dateSliderID;
    this.timeSliderID = timeSliderID;
    this.errID = errID;
    this.callback = dataRefreshCallback;
    this.disableCallback = disablePageCallback;
    this.enableCallback = enablePageCallback;
    this.cacheSyms = null;

    this.init();
    this.fetchSymbols();
  }

  init() {
    
    this.excEl    = document.getElementById(this.excID);
    this.instEl   = document.getElementById(this.instID);
    this.undEl    = document.getElementById(this.undID);
    this.expEl    = document.getElementById(this.expID);
    this.stkEl    = document.getElementById(this.stkID);
    this.cepeEl   = document.getElementById(this.cepeID);
    this.daysEl   = document.getElementById(this.daysID);
    this.dateSliderEl = document.getElementById(this.dateSliderID);
    this.timeSliderEl = document.getElementById(this.timeSliderID);
    this.errEl    = document.getElementById(this.errID);

    if (this.dateSliderEl) {
      let initDates = ["01-01-2021", "01-02-2021", "01-03-2021"];

      $(this.dateSliderEl).ionRangeSlider({
        skin: "round",
        type: "single",
        grid: true,
        values: initDates,
        from: 0,   // initDates.indexOf("2021-01-01")
        //to: 2,   // initDates.indexOf("2021-01-03")
        force_edges: true,
        onFinish: (data) => { this.fetchRecords(); },
        onUpdate: (data) => { this.fetchRecords(); }
      });

      this.dateSlider = $(this.dateSliderEl).data('ionRangeSlider');
    }

    $(this.timeSliderEl).ionRangeSlider({
      skin: "round",
      type: "single",
      grid: true,
      min: UIUtils.dateToTS(new Date("2021-01-01T09:15:00+05:30")),
      max: UIUtils.dateToTS(new Date("2021-01-01T15:30:00+05:30")),
      from: UIUtils.dateToTS(new Date("2021-01-01T12:00:00+05:30")),
      //to: UIUtils.dateToTS(new Date("2021-01-01T13:00:00+05:30")),
      force_edges: true,
      prettify: UIUtils.tsToDate,
      onFinish: (data) => { this.fetchRecords(data); },
      onUpdate: (data) => { this.fetchRecords(data); }
    });

    this.timeSlider = $(this.timeSliderEl).data('ionRangeSlider');

    this.setupEventHandlers();
  }

  fetchSymbols() {
    
    DBFacade.fetchLists().then(symList => {
      this.cacheSyms = symList;
      this.loadExchanges();
    });
  }

  setupEventHandlers() {
    this.excEl.addEventListener('change', ev => this.loadInstruments(ev));
    this.excEl.addEventListener('update-sel', ev => this.loadInstruments(ev));

    this.instEl.addEventListener('change', ev => this.loadUnderlying(ev));
    this.instEl.addEventListener('update-sel', ev => this.loadUnderlying(ev));

    this.undEl.addEventListener('change', ev => this.loadExpiries(ev));
    this.undEl.addEventListener('change', ev => this.loadDays(ev));
    this.undEl.addEventListener('update-sel', ev => this.loadExpiries(ev));
    this.undEl.addEventListener('update-sel', ev => this.loadDays(ev));

    this.expEl.addEventListener('change', ev => this.loadStrikes(ev));
    this.expEl.addEventListener('change', ev => this.loadDays(ev));
    this.expEl.addEventListener('update-sel', ev => this.loadStrikes(ev));
    this.expEl.addEventListener('update-sel', ev => this.loadDays(ev));

    this.stkEl.addEventListener('change', ev => this.updateDatetimeSlider(ev));
    this.cepeEl.addEventListener('change', ev => this.updateDatetimeSlider(ev));
    this.stkEl.addEventListener('update-sel', ev => this.updateDatetimeSlider(ev));
    this.cepeEl.addEventListener('update-sel', ev => this.updateDatetimeSlider(ev));

    this.daysEl.addEventListener('change', ev => this.updateDatetimeSlider(ev));
    this.daysEl.addEventListener('update-sel', ev => this.updateDatetimeSlider(ev));
  }

  loadExchanges(trade=null) {
    this.disableCallback();
    UIUtils.addSpinner(this.excID);
    UIUtils.updSelectDropdown(this.excID, this.cacheSyms.getAs());
 
    // This event will be processed synchronously, as it's raised within another event handler.
    //   listeners on excEl will be processed completely before this method completes.
    if (trade) {
      let instrument = trade;
      if (trade instanceof Trade) {
        instrument = trade.inst;
      }
      if (trade instanceof TradingInstrument) {
        trade = null;
      }

      this.excEl.value = instrument.sym.a;
      this.excEl.dispatchEvent(new CustomEvent("update-sel", {
        detail: { "trade": trade, "instrument": instrument }
      }));
    } else {
      this.excEl.dispatchEvent(new CustomEvent("update-sel", {
        detail: { "trade": null, "instrument": null }
      }));
    }

    UIUtils.rmSpinner(this.excID);
  }

  loadInstruments(event) {
    this.disableCallback();
    UIUtils.addSpinner(this.instID);
    UIUtils.updSelectDropdown(this.instID, this.cacheSyms.getBs(this.excEl.value));
    
    // Rather than checking the event.type (change or update-sel), we check the detail attr
    //   which will be present only in CustomEvent when raised through updateSelectors()
    if (event.detail && event.detail.instrument) {
      this.instEl.value = event.detail.instrument.sym.b;
      this.instEl.dispatchEvent(new CustomEvent("update-sel", {
        detail: event.detail
      }));
    } else {
      this.instEl.dispatchEvent(new CustomEvent("update-sel", {
        detail: { trade: null, instrument: null }
      }));
    }
    UIUtils.rmSpinner(this.instID);
  }

  loadUnderlying(event) {
    this.disableCallback();
    UIUtils.addSpinner(this.undID);
    UIUtils.updSelectDropdown(this.undID, Array.from(this.cacheSyms.getCs(this.excEl.value, this.instEl.value), val => val.c));
    
    if (event.detail && event.detail.instrument) {
      this.undEl.value = event.detail.instrument.sym.c;
      this.undEl.dispatchEvent(new CustomEvent("update-sel", {
        detail: event.detail
      }));
    } else {
      this.undEl.dispatchEvent(new CustomEvent("update-sel", {
        detail: { trade: null, instrument: null }
      }));
    }
    
    UIUtils.rmSpinner(this.undID);
  }

  loadExpiries(event) {
    if (event.target === this.undEl) {
      if (this.instEl.value !== "INDEX") {  // Load for both Options and Futures
        this.disableCallback();
        UIUtils.addSpinner(this.expID);
        let leaf = this.cacheSyms.getLeaf(this.excEl.value, this.instEl.value, this.undEl.value);
        
        DBFacade.fetchLists(leaf).then(data => {
          if (data.exps) {
            UIUtils.updSelectDropdown(this.expID, data.exps, true);
            if (event.detail && event.detail.instrument) {
              this.expEl.value = event.detail.instrument.exp;
              this.expEl.dispatchEvent(new CustomEvent("update-sel", {
                detail: event.detail
              }));
            } else {
              this.expEl.dispatchEvent(new CustomEvent("update-sel", {
                detail: { trade: null, instrument: null }
              }));
            }
          }

          if (data.days) {
            UIUtils.updSelectDropdown(this.daysID, data.days, true);
            //UIUtils.updateDatetimeSlider(this.sliderID, this.daysID, true);  //singleThumb fixed?
            if (event.detail && event.detail.trade) {
              this.daysEl.value = event.detail.trade.day;
              this.daysEl.dispatchEvent(new CustomEvent("update-sel", {
                detail: event.detail
              }));
            } else {
              this.daysEl.dispatchEvent(new CustomEvent("update-sel", {
                detail: { trade: null, instrument: null }
              }));
            }
          }

          UIUtils.rmSpinner(this.expID);
        }).catch(error => {
          console.log("Error fetching expiries : " + error);
          UIUtils.showAlert(this.errID, error);
          UIUtils.rmSpinner(this.expID);
        });
      } else {
        console.log("Exp: Ignore this change");
      }
    }
  }

  loadStrikes(event) {
    if (this.instEl.value === "OPTIONS") {
      this.disableCallback();
      UIUtils.addSpinner(this.stkID);
      let leaf = this.cacheSyms.getLeaf(this.excEl.value, this.instEl.value, this.undEl.value);

      DBFacade.fetchLists(leaf, this.expEl.value).then(data => {
        // Strikes to be loaded first, on loading days first the fetchRecs() gets triggered
        //   before strikes are fully loaded.
        if (data.stks) {
          UIUtils.updSelectDropdown(this.stkID, data.stks, false);
          // Not raising event as it generates duplicate calls to backend
          //this.stkEl.dispatchEvent(new Event("change"));
          if (event.detail && event.detail.instrument) {
            this.stkEl.value = event.detail.instrument.stk;
          }

          UIUtils.updSelectDropdown(this.cepeID, ["CE", "PE"], false);
          // Not raising event as it generates duplicate calls to backend
          //this.cepeEl.dispatchEvent(new Event("change"));
          if (event.detail && event.detail.instrument) {
            this.cepeEl.value = event.detail.instrument.opt;
          }
        }

        if (data.days) {
          UIUtils.updSelectDropdown(this.daysID, data.days, true);
          if (event.detail && event.detail.trade) {
            this.daysEl.value = event.detail.trade.day;
            this.daysEl.dispatchEvent(new CustomEvent("update-sel", {
              detail: event.detail
            }));
          } else {
            this.daysEl.dispatchEvent(new CustomEvent("update-sel", {
              detail: { trade: null, instrument: null }
            }));
          }
        }

        UIUtils.rmSpinner(this.stkID);
      }).catch(error => {
        console.log("Error fetching strikes : " + error);
        UIUtils.showAlert(this.errID, error);
        UIUtils.rmSpinner(this.stkID);
      });
    } else {
      console.log("Strikes are loaded only for Options");
    }
  }

  loadDays(event) {
    if (this.instEl.value === "INDEX" || this.instEl.value === "FUTURES") {
      // Load Days
      this.disableCallback();
      UIUtils.addSpinner(this.daysID);
      let leaf = this.cacheSyms.getLeaf(this.excEl.value, this.instEl.value, this.undEl.value);
      let exp = null;
      if (this.instEl.value === "FUTURES") {
        exp = this.expEl.value;
        if (exp == 0) {
          console.log("Expiry not yet updated");
          UIUtils.rmSpinner(this.daysID);
          return;
        }
      }

      DBFacade.fetchLists(leaf, exp).then(data => {
        if (data.days) {
          UIUtils.updSelectDropdown(this.daysID, data.days, true);
          //UIUtils.updateDatetimeSlider(this.sliderID, this.daysID, true);  // SingleThumb?
          if (event.detail && event.detail.trade) {
            this.daysEl.value = event.detail.trade.day;
            this.daysEl.dispatchEvent(new CustomEvent("update-sel", {
              detail: event.detail
            }));
          } else {
            this.daysEl.dispatchEvent(new CustomEvent("update-sel", {
              detail: { trade: null, instrument: null }
            }));
          }
        }

        UIUtils.rmSpinner(this.daysID);
      }).catch(error => {
        console.log("Error fetching days : " + error);
        UIUtils.showAlert(this.errID, error);
        UIUtils.rmSpinner(this.daysID);
      });
    } else {
      //console.log("Days: Ignore this change");
    }

    this.disableUnwanted();
  }

  updateDatetimeSlider(event) {
    console.log("Triggered date time slider update");
    this.disableCallback();  // Disable the Page interactions, enable only after fetchRecs

    if (this.dateSlider) {
      //let dateRangeSlider = $(this.dateSliderEl).data('ionRangeSlider');
      let dateRange = [];
      let options = this.daysEl.options;
      let fromIdx = 0;
      for (let i = 0; i < options.length; i++) {
        dateRange.push(options[i].label);
        if (event.detail && event.detail.trade && options[i].value == event.detail.trade.day) {
          fromIdx = i;
        }
      }
      
      this.dateSlider.update({
        from: fromIdx,
        values: dateRange
      });
    }

    //let timeRangeSlider = $(this.timeSliderEl).data('ionRangeSlider');
    const date = this.daysEl.value.substr(0, 4) + "-" + this.daysEl.value.substr(4, 2) + "-" + this.daysEl.value.substr(6, 2);

    let fromVal = UIUtils.dateToTS(new Date(date + UIUtils.DAY_MID));
    if (event.detail && event.detail.trade) {
      fromVal = event.detail.trade.tod;
    }

    this.timeSlider.update({
      min: UIUtils.dateToTS(new Date(date + UIUtils.DAY_START)),
      max: UIUtils.dateToTS(new Date(date + UIUtils.DAY_END)),
      from: fromVal
    });
  }

  updateSelectors(record) {
    // Set the values of the dropdowns as given record (Instrument or Trade)
    this.loadExchanges(record);  // This will cascading trigger listeners for all
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cacheAllSelectors() {
    while (this.cacheSyms === null) {
      // We wait for cacheSyms to get set
      await this.sleep(1000);
    }
    
    // We assume that the fetchSymbols() is complete by now
    for (let a of this.cacheSyms.getAs()) {
      for (let b of this.cacheSyms.getBs(a)) {
        for (let leaf of this.cacheSyms.getCs(a, b)) {
          await DBFacade.fetchLists(leaf);
          if (!leaf.isIndex) {
            for (let exp of leaf.expiries) {
              //await DBFacade.fetchLists(leaf, exp);
              DBFacade.fetchLists(leaf, exp);  // Trigger fetch, no await-ing!!?
            }
          }
        }
      }
    }

    return this.cacheSyms;
  }

  fetchRecords(dataORevent) {  // data when call is from the slider, event when from event listener
    console.log("selector fetchrecs");
    this.disableCallback();  // Disable the Page interactions

    DBFacade.fetchRecs(this.excEl.value, this.instEl.value, this.undEl.value,
      this.expEl.value, Math.floor(this.timeSlider.result.from / 60000) * 60, 
      this.stkEl.value, this.cepeEl.value, null, null)
      .then(response => { 
        this.callback(response);
        console.log("selector fetchrecs success");
        this.enableCallback();  // Enable the Page interactions
      } )
      .catch(error => { 
        console.log(error);
        this.callback(error);
        console.log("selector fetchrecs failure");
        this.enableCallback();  // Enable the Page interactions
      });
  }

  get instrument() {
    let inst = new TradingInstrument(this.cacheSyms.getLeaf(this.excEl.value, this.instEl.value, this.undEl.value));
    
    if (inst.isFuture) {
      inst.exp = this.expEl.value;
    }
    if (inst.isOption) {
      inst.exp = this.expEl.value;
      inst.stk = this.stkEl.value;
      inst.opt = this.cepeEl.value;
    }
    
    inst.simulationTS = this.timeSliderVal;

    return inst;
  }

  get timeSliderVal() {
    // Value at the Time Slider's thumb in msec
    return this.timeSlider.result.from;
  }
  set timeSliderVal(val) {
    this.timeSlider.update({
      from: val
    });
  }

  disableUnwanted() {
    let inst = this.instrument;
    if (inst.isIndex) {
      this.expEl.disabled = true;
      this.stkEl.disabled = true;
      this.cepeEl.disabled = true;
      this.daysEl.disabled = false;
    } else if (inst.isFuture) {
      this.expEl.disabled = false;
      this.stkEl.disabled = true;
      this.cepeEl.disabled = true;
      this.daysEl.disabled = false;
    } else {
      this.expEl.disabled = false;
      this.stkEl.disabled = false;
      this.cepeEl.disabled = false;
      this.daysEl.disabled = false;
    }
  }
}

/* // Not in Use
class StrategyCardRenderer {

  constructor(cardTemplate=null, editorTemplate=null) {
    if (StrategyCardRenderer.instance) {
      return StrategyCardRenderer.instance;
    }

    // These all members are not used any more.
    this.valueCardHTML = `
    <div class="col mb-3" id="STG_ID"> 
      <div class="card shadow-sm">
        <div class="card-header">
          <div>STG_NAME
            <a class="bi-trash text-danger float-end" href="#" 
              onclick="deleteStrategy(\'STG_ID\')" aria-label="Remove"></a> 
            <a class="bi-pencil-square text-primary float-end me-2" href="#" aria-label="Edit" 
              onclick="editStrategy(\'STG_ID\')"></a> 
          </div>
        </div> 
        <div class="card-body text-center"> BODY_DATA </div> 
        <div class="card-footer text-muted"> <small>FOOTER_DATA</small> </div> 
      </div> 
    </div>`;

    if (cardTemplate) {
      //let temp = document.getElementById(cardTemplate);
      //this.valueCardHTML = temp.innerHTML;
    }

    this.fullCardHTML = `
    <div class="col">
      <div class="card text-center mb-3" id="STG_ID"> 
        <div class="card-header"> 
          <div class="d-flex"> 
            <div class="me-auto align-self-center"> 
              <span>STG_NAME</span>
            </div> 
            <ul class="nav nav-pills" role="tablist"> 
              <li class="nav-item" role="presentation"> 
                <a href="#" class="nav-link active" id="legs-tabSTG_ID" data-bs-toggle="pill" 
                  data-bs-target="#legsSTG_ID" type="button" role="tab" aria-controls="legs" 
                  aria-selected="true">Legs</a>
              </li> 
              <li class="nav-item" role="presentation"> 
              <a href="#" class="nav-link" id="greeks-tabSTG_ID" data-bs-toggle="pill" 
                data-bs-target="#greeksSTG_ID" type="button" role="tab" aria-controls="greeks" 
                aria-selected="false">Greeks</a> 
              </li> 
              <li class="nav-item" role="presentation"> 
                <a href="#" class="nav-link disabled" id="other-tabSTG_ID" data-bs-toggle="pill" 
                  data-bs-target="#otherSTG_ID" type="button" role="tab" aria-controls="other" 
                  aria-selected="false" tabindex="-1" aria-disabled="true">Disabled</a> 
              </li> 
            </ul> 
          </div> 
        </div> 
        <div class="card-body tab-content"> 
          <div class="tab-pane fade show active" id="legsSTG_ID" role="tabpanel" 
            aria-labelledby="legs-tabSTG_ID"> 
            <div class="table-responsive"> 
              <table class="table caption-top table-sm"> 
                <thead>
                  <tr> 
                    <th scope="col">#</th> 
                    <th scope="col">Instrument</th> 
                    <th scope="col">B/S</th> 
                    <th scope="col">Qty</th> 
                    <th scope="col">Entry Price</th> 
                    <th scope="col">Current Price</th> 
                    <th scope="col">Live P&L</th> 
                    <th scope="col">Exit Price</th> 
                    <th scope="col">P&L</th> 
                    <th scope="col"> </th>  
                  </tr>
                </thead> 
                <tbody>STG_LEGS</tbody> 
                <tfoot> STG_FOOTER </tfoot> 
              </table> 
            </div> 
          </div> 
          <div class="tab-pane fade" id="greeksSTG_ID" role="tabpanel" 
            aria-labelledby="greeks-tabSTG_ID"> Greeks </div>  
          <div class="tab-pane fade" id="otherSTG_ID" role="tabpanel" 
            aria-labelledby="other-tabSTG_ID"> Other </div> 
        </div> 
        <div class="card-footer text-muted"> 
          <small>FOOTER_DATA</small> 
          <a href="#" class="me-2 bi-save-fill text-success float-end" 
            onclick="saveStrategy(\'STG_ID\')"></a> 
          <a href="#" class="me-2 bi-trash text-danger float-end" 
            onclick="deleteStrategy(\'STG_ID\')"></a> 
        </div>
      </div>
    </div>`;

    if (editorTemplate) {
      //let temp = document.getElementById(editorTemplate);
      //this.fullCardHTML = temp.innerHTML;
    }
  }
  
  static getInstance() {
    if (!StrategyCardRenderer.instance) {
      StrategyCardRenderer.instance = new StrategyCardRenderer();
    }

    return StrategyCardRenderer.instance;
  }

  getValueCard(stg) {
    // Raises delstg and edtstg events
    if (!stg) {
      return "";
    }
    
    let value = stg.curValue.toFixed(2);

    let html = `
    <div class="col mb-3" id="${stg.id}"> 
      <div class="card shadow-sm">
        <div class="card-header">
          <div>${stg.name}
            <a class="bi-trash text-danger float-end" href="#/" 
              onclick="this.dispatchEvent(new CustomEvent('delstg', {
                bubbles: true, calcelable: true, detail: { stg: '${stg.id}' } 
              }))" aria-label="Remove"></a> 
            <a class="bi-pencil-square text-${stg.isinFullView ? "danger" : "primary"} float-end me-2" href="#/" aria-label="Edit" 
              onclick="this.dispatchEvent(new CustomEvent('edtstg', {
                bubbles: true, calcelable: true, detail: { stg: '${stg.id}' } 
              }))"></a> 
          </div>
        </div> 
        <div class="card-body text-center">
          <h5 class="card-title text-${value >= 0 ? "success" : "danger"}">${value}</h5>
          <span>${stg.count.toString()} Legs</span>
        </div> 
        <div class="card-footer text-muted"> 
          <small> Created: ${new Date(stg.createTime).toLocaleString()}</small> 
        </div> 
      </div> 
    </div>`;

    return html;
  }

  getFullCard(stg) {
    // // Raises savstg, delleg and delstg events
    if (!stg) {
      return "";
    }

    let allLegs = "";
    for (let i = 0; i < stg.legs.length; i++) {
      let leg = stg.legs[i];

      let row = `<tr>
      <th scope="row">${(i + 1).toString()}</th>
      <td> ${leg.key}</td>
      <td>${leg.isBuy ? "Buy" : "Sell"}</td>
      <td>${leg.isBuy ? "" : "-"}${leg.tqty.toString()}</td>
      <td>${leg.entryPrice.toFixed(2)}</td>
      <td>${leg.curPrice.toFixed(2)}</td>
      <td class=${leg.curPosition >= 0 ? "text-success" : "text-danger"}>${leg.curPosition.toFixed(2)}</td>
      <td></td>
      <td></td>
      <td>
        <a class="bi-trash text-danger" href="#/" aria-label="Remove" 
          onclick="this.dispatchEvent(new CustomEvent('delleg', {
            bubbles: true, calcelable: true, detail: { stg: '${stg.id}', leg: '${leg.id}' } 
          }))"></a>
      </td>
      </tr>
      `;

      allLegs += row;
    }

    let footer = `<tr> 
    <td></td> 
    <td></td> 
    <td></td> 
    <td></td> 
    <td></td> 
    <td></td> 
    <td>0</td> 
    <td></td> 
    <td>0</td> 
    </tr>`;

    let fullCardHTML = `
      <div class="card text-center mb-3" id="${stg.id}"> 
        <div class="card-header"> 
          <div class="d-flex"> 
            <div class="me-auto align-self-center"> 
              <span>${stg.name}</span>
            </div> 
            <ul class="nav nav-pills" role="tablist"> 
              <li class="nav-item" role="presentation"> 
                <a href="#" class="nav-link active" id="legs-tab${stg.id}" data-bs-toggle="pill" 
                  data-bs-target="#legs${stg.id}" type="button" role="tab" aria-controls="legs" 
                  aria-selected="true">Legs</a>
              </li> 
              <li class="nav-item" role="presentation"> 
              <a href="#" class="nav-link" id="greeks-tab${stg.id}" data-bs-toggle="pill" 
                data-bs-target="#greeks${stg.id}" type="button" role="tab" aria-controls="greeks" 
                aria-selected="false">Greeks</a> 
              </li> 
              <li class="nav-item" role="presentation"> 
                <a href="#" class="nav-link disabled" id="other-tab${stg.id}" data-bs-toggle="pill" 
                  data-bs-target="#other${stg.id}" type="button" role="tab" aria-controls="other" 
                  aria-selected="false" tabindex="-1" aria-disabled="true">Disabled</a> 
              </li> 
            </ul> 
          </div> 
        </div> 
        <div class="card-body tab-content"> 
          <div class="tab-pane fade show active" id="legs${stg.id}" role="tabpanel" 
            aria-labelledby="legs-tab${stg.id}"> 
            <div class="table-responsive"> 
              <table class="table caption-top table-sm"> 
                <thead>
                  <tr> 
                    <th scope="col">#</th> 
                    <th scope="col">Instrument</th> 
                    <th scope="col">B/S</th> 
                    <th scope="col">Qty</th> 
                    <th scope="col">Entry Price</th> 
                    <th scope="col">Current Price</th> 
                    <th scope="col">Live P&L</th> 
                    <th scope="col">Exit Price</th> 
                    <th scope="col">P&L</th> 
                    <th scope="col"> </th>  
                  </tr>
                </thead> 
                <tbody>${allLegs}</tbody> 
                <tfoot> ${footer} </tfoot> 
              </table> 
            </div> 
          </div> 
          <div class="tab-pane fade" id="greeks${stg.id}" role="tabpanel" 
            aria-labelledby="greeks-tab${stg.id}"> Greeks </div>  
          <div class="tab-pane fade" id="other${stg.id}" role="tabpanel" 
            aria-labelledby="other-tab${stg.id}"> Other </div> 
        </div> 
        <div class="card-footer text-muted"> 
          <small>Created On: ${new Date(stg.createTime).toLocaleString()}</small> 
          <a href="#/" class="me-2 bi-save-fill text-success float-end" 
            onclick=" this.dispatchEvent(new CustomEvent('savstg', {
              bubbles: true, calcelable: true, detail: { stg: '${stg.id}' } 
            }))"></a> 
          <a href="#/" class="me-2 bi-trash text-danger float-end" 
            onclick="this.dispatchEvent(new CustomEvent('delstg', {
              bubbles: true, calcelable: true, detail: { stg: '${stg.id}' } 
            }))"></a> 
        </div>
    </div>`;

    return new StrategyFullCardElement(fullCardHTML, "col");
  }
}

// Not in Use
class StrategyCard extends Strategy {
  constructor(name, stg=null) {
    
    super(name);
    throw new Error("Cannot use StrategyCard");

    //console.log(`Creating Card [${name}] ${ (stg) ? "with stg" : "without stg"}`);
    this._fullCardParentJNode = null;
    this._valueCardParentJNode = null;

    this._fullCardJNode = null;
    this._valueCardJNode = null;

    if (stg) {
      this._assign(stg);
    }
  }

  setParentNodeIDs(fullNodeID, valueNodeID) {
    //console.log(`Setting parents Full [${fullNodeID}], Mini [${valueNodeID}]`);
    this._fullCardParentJNode = $("#" + fullNodeID);
    this._valueCardParentJNode = $("#" + valueNodeID);
  }

  update() {
    
    //this._fullCardJNode = $(StrategyCardRenderer.getInstance().getFullCard(this));
    this._fullCardJNode = $(new StrategyFullCardElement(this));
    if (this.isinFullView) {
      this.showInFullView();
    }

    //this._valueCardJNode = $(StrategyCardRenderer.getInstance().getValueCard(this));
    this._valueCardJNode = $(new StrategyValueCardElement(this));
    this.updateValueCardView();
  }

  _assign(other) {
    // Takeover all attributes of other
    super._assign(other);
    this.update();
  }

  clone() {
    let base = super.clone();
    let newobj = new StrategyCard(base.name);
    newobj._assign(base);

    return newobj;
  }

  copy() {
    let base = super.copy();
    let newobj = new StrategyCard(base.name);
    newobj._assign(base);

    return newobj;
  }

  static fromObject(obj) {
    let stg = Strategy.fromObject(obj);
    
    return new StrategyCard(stg.name, stg);
  }

  add(leg, settle) {
    super.add(leg, settle);
    this.update();
  }

  remove(legID) {
    super.remove(legID);
    this.update();
  }

  async updatePrice(tmstmp, resolve, reject) {
    let res = await super.updatePrice(tmstmp, resolve, reject);
    this.update();
    return res;
  }

  async delete() {
    this.removeFromViews();
    return await super.delete();
  }

  get jFullCardNode() {
    return this._fullCardJNode;
  }

  get jValueCardNode() {
    return this._valueCardJNode;
  }

  get jFullViewNode() {
    return this._fullCardParentJNode;
  }

  get jValueViewNode() {
    return this._valueCardParentJNode;
  }

  get isinFullView() {
    // Checks whether this card is in Full View or not
    if (this.jFullViewNode) {
      let child = this.jFullViewNode.find(".card");
      if (child) {
        return child.attr("id") === this.id;
      }
    }

    return false;
  }

  showInFullView() {
    if (this.jFullViewNode) {
      this.jFullViewNode.empty().append(this.jFullCardNode);
    }
  }

  get isinValueCardView() {
    if (this.jValueViewNode) {
      return this.jValueViewNode.children("#" + this.id).length > 0;
    }
  }

  updateValueCardView() {
    if (this.jValueViewNode) {
      if (this.isinValueCardView) {
        //console.log(`Replacing ${this.id} to ValueCardView ${this._valueCardParentJNode.attr("id")}`);
        this.jValueViewNode.children("#" + this.id).replaceWith(this.jValueCardNode);
      } else {
        //console.log(`Apppending ${this.id} to ValueCardView ${this._valueCardParentJNode.attr("id")}`);
        this.jValueViewNode.append(this.jValueCardNode);
      }
    }
  }

  removeFromViews() {
    if (this.isinFullView) {
      this.jFullViewNode.empty();
    }

    if (this.isinValueCardView) {
      this.jValueViewNode.children("#" + this.id).remove();
    }
  }
}
 */

class StrategyFullCardElement extends HTMLDivElement {
  constructor(stg=null) {
    super();
    // element created

    this.stg = stg;
    
    this.innerHTML = this.getFullCard( (stg) ? stg : new Strategy("Edit Name") );
  }

  get current() {
    return this.stg;
  }

  update(stg=null) {
    $(this).empty();
    this.stg = stg;
    this.innerHTML = this.getFullCard( (stg) ? stg : new Strategy("Edit Name") );
  }

  getFullCard(stg) {
    // // Raises savstg, delleg and delstg events
/*     if (!stg) {
      // We can return an empty editor look
      let stgid = Date.now();
      return `
      <div class="card text-center mb-3" id="${stgid}"> 
        <div class="card-header"> 
          <div class="d-flex"> 
            <div class="me-auto align-self-center"> 
              <span>New Strategy</span>
            </div> 
            <ul class="nav nav-pills" role="tablist"> 
              <li class="nav-item" role="presentation"> 
                <a href="#" class="nav-link active" id="legs-tab${stgid}" data-bs-toggle="pill" 
                  data-bs-target="#legs${stgid}" type="button" role="tab" aria-controls="legs" 
                  aria-selected="true">Legs</a>
              </li> 
              <li class="nav-item" role="presentation"> 
              <a href="#" class="nav-link" id="greeks-tab${stgid}" data-bs-toggle="pill" 
                data-bs-target="#greeks${stgid}" type="button" role="tab" aria-controls="greeks" 
                aria-selected="false">Greeks</a> 
              </li> 
              <li class="nav-item" role="presentation"> 
                <a href="#" class="nav-link disabled" id="other-tab${stgid}" data-bs-toggle="pill" 
                  data-bs-target="#other${stgid}" type="button" role="tab" aria-controls="other" 
                  aria-selected="false" tabindex="-1" aria-disabled="true">Disabled</a> 
              </li> 
            </ul> 
          </div> 
        </div> 
        <div class="card-body tab-content"> 
          <div class="tab-pane fade show active" id="legs${stgid}" role="tabpanel" 
            aria-labelledby="legs-tab${stgid}"> 
            <div class="table-responsive"> 
              <table class="table table-sm mb-0"> 
                <thead>
                  <tr> 
                    <th scope="col">#</th> 
                    <th scope="col">Instrument</th> 
                    <th scope="col">B/S</th> 
                    <th scope="col">Qty</th> 
                    <th scope="col">Entry Price</th> 
                    <th scope="col">Current Price</th> 
                    <th scope="col">Live P&L</th> 
                    <th scope="col">Exit Price</th> 
                    <th scope="col">P&L</th> 
                    <th scope="col"> </th>  
                  </tr>
                </thead> 
                <tbody><tr><td colspan="10">BUY or SELL (add a Leg)</td></tr></tbody> 
              </table> 
            </div> 
          </div> 
          <div class="tab-pane fade" id="greeks${stgid}" role="tabpanel" 
            aria-labelledby="greeks-tab${stgid}"> Greeks </div>  
          <div class="tab-pane fade" id="other${stgid}" role="tabpanel" 
            aria-labelledby="other-tab${stgid}"> Other </div> 
        </div> 
        <div class="card-footer text-muted"> 
          <small>${new Date().toLocaleString()}</small> 
          <a href="#" class="me-2 bi-save-fill text-success float-end"></a> 
          <a href="#" class="me-2 bi-trash text-danger float-end"></a> 
        </div>
      </div>`;
    }
 */
    
    let allLegs = "";
    for (let i = 0; i < stg.legs.length; i++) {
      let leg = stg.legs[i];

      let row = `<tr>
      <th scope="row">${(i + 1).toString()}</th>
      <td> ${leg.key}</td>
      <td> ${new Date(leg.createTime).toLocaleString("en-IN")}</td>
      <td>${leg.isBuy ? "Buy" : "Sell"}</td>
      <td>${(leg.isBuy || leg.lots === 0) ? "" : "-"}${leg.tqty.toString()}</td>
      <td>${leg.entryPrice.toFixed(2)}</td>
      <td>${leg.curPrice.toFixed(2)}</td>
      <td>${leg.exitPrice > 0 ? leg.exitPrice.toFixed(2) : ""}</td>
      <td class=${leg.curPosition >= 0 ? "text-success" : "text-danger"}>${leg.curPosition.toFixed(2)}</td>
      <td>
        <a class="bi-trash text-danger" href="#/" aria-label="Remove" 
          onclick="this.dispatchEvent(new CustomEvent('delleg', {
            bubbles: true, calcelable: true, detail: { stg: '${stg.id}', leg: '${leg.id}' } 
          }))"></a>
      </td>
      </tr>
      `;

      allLegs += row;
    }

    if (allLegs.length === 0) {
      allLegs = `<tr><td colspan="10">BUY or SELL (add a Leg)</td></tr>`;
    }

    let footer = `<tr> 
    <td></td> 
    <td></td>
    <td></td> 
    <td></td> 
    <td></td> 
    <td></td> 
    <td></td> 
    <td></td> 
    <td>${stg.curPosition.toFixed(2)}</td>
    <td></td>
    </tr>`;

    let fullCardHTML = `
    <div class="col">
      <div class="card text-center mb-3" id="${stg.id}"> 
        <div class="card-header"> 
          <div class="d-flex"> 
            <div class="me-auto align-self-center"> 
              <span>${stg.name}</span>
            </div> 
            <ul class="nav nav-pills" role="tablist"> 
              <li class="nav-item" role="presentation"> 
                <a href="#" class="nav-link active" id="legs-tab${stg.id}" data-bs-toggle="pill" 
                  data-bs-target="#legs${stg.id}" type="button" role="tab" aria-controls="legs" 
                  aria-selected="true">Legs</a>
              </li> 
              <li class="nav-item" role="presentation"> 
              <a href="#" class="nav-link" id="greeks-tab${stg.id}" data-bs-toggle="pill" 
                data-bs-target="#greeks${stg.id}" type="button" role="tab" aria-controls="greeks" 
                aria-selected="false">Greeks</a> 
              </li> 
              <li class="nav-item" role="presentation"> 
                <a href="#" class="nav-link disabled" id="other-tab${stg.id}" data-bs-toggle="pill" 
                  data-bs-target="#other${stg.id}" type="button" role="tab" aria-controls="other" 
                  aria-selected="false" tabindex="-1" aria-disabled="true">P&L Chart</a> 
              </li> 
            </ul> 
          </div> 
        </div> 
        <div class="card-body tab-content"> 
          <div class="tab-pane fade show active" id="legs${stg.id}" role="tabpanel" 
            aria-labelledby="legs-tab${stg.id}"> 
            <div class="table-responsive"> 
              <table class="table table-sm table-hover mb-0"> 
                <thead>
                  <tr> 
                    <th scope="col">#</th> 
                    <th scope="col">Contract</th>
                    <th scope="col">Traded On</th> 
                    <th scope="col">B/S</th> 
                    <th scope="col">Qty</th> 
                    <th scope="col">Entry Price</th> 
                    <th scope="col">Current Price</th> 
                    <th scope="col">Exit Price</th> 
                    <th scope="col">P&L</th> 
                    <th scope="col"> </th>  
                  </tr>
                </thead> 
                <tbody>${allLegs}</tbody> 
                <tfoot> ${footer} </tfoot> 
              </table> 
            </div> 
          </div> 
          <div class="tab-pane fade" id="greeks${stg.id}" role="tabpanel" 
            aria-labelledby="greeks-tab${stg.id}"> Greeks (Not Available Yet) </div>  
          <div class="tab-pane fade" id="other${stg.id}" role="tabpanel" 
            aria-labelledby="other-tab${stg.id}"> Other </div> 
        </div> 
        <div class="card-footer text-muted"> 
          <small>Created : ${new Date(stg.createTime).toLocaleString("en-IN")}, 
                 Last Updated : ${new Date(stg.lastUpdateTime).toLocaleString("en-IN")}</small> 
          <a href="#/" class="me-2 bi-save-fill text-success float-end" 
            onclick=" this.dispatchEvent(new CustomEvent('savstg', {
              bubbles: true, calcelable: true, detail: { stg: '${stg.id}' } 
            }))"></a> 
          <a href="#/" class="me-2 bi-trash text-danger float-end" 
            onclick="this.dispatchEvent(new CustomEvent('delstg', {
              bubbles: true, calcelable: true, detail: { stg: '${stg.id}' } 
            }))"></a> 
        </div>
      </div>
    </div>`;

    return fullCardHTML;
  }

  connectedCallback() {
    // browser calls this method when the element is added to the document
    // (can be called many times if an element is repeatedly added/removed)
    //console.log("connected");
  }

  disconnectedCallback() {
    // browser calls this method when the element is removed from the document
    // (can be called many times if an element is repeatedly added/removed)
    //console.log("disconnected");
  }

  static get observedAttributes() {
    return [];  /* array of attribute names to monitor for changes */
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // called when one of attributes listed above is modified
  }

  adoptedCallback() {
    // called when the element is moved to a new document
    // (happens in document.adoptNode, very rarely used)
  }

  // there can be other element methods and properties
}
customElements.define("strategy-editor", StrategyFullCardElement, {extends: 'div'});

class StrategyValueCardElementList extends HTMLDivElement {
  constructor() {
    super();
  }

  updateCards(stgList=null) {

    while (this.firstChild) {
      this.removeChild(this.firstChild)
    }

    // First child is a null child which lets users to create new strategies/cards
    this.appendChild( new StrategyValueCardElement(null) );

/*     if (stgList) {
      jqThis.data("stgList", stgList);  // Save a reference, not a copy
    } else {
      stgList = jqThis.data("stgList");
    } */

    if (stgList) {
      for (let strategy of stgList.values()) {
        this.appendChild( new StrategyValueCardElement(strategy) )
      }
    }
  }

  _getElem(stg) {
    let stgID = stg;
    if (stg instanceof Strategy) {
      stgID = stg.id;
    }

    for (let i = 0; i < this.children.length; i++) {
      // First child does not have a strategy (Start New - Card)
      if (this.children[i].stg && stgID === this.children[i].stg.id) {
        return this.children[i];
      }
    }

    return null;
  }

  updateCard(stg, stgInEdit=false) {
    // stg can be Strategy or String ID
    let stgElem = this._getElem(stg);

    if (stgElem) {
      $(stgElem.replaceWith(new StrategyValueCardElement(stg, stgInEdit)));
    } else {
      this.appendChild(new StrategyValueCardElement(stg, stgInEdit));
    }
  }

  removeCard(stg) {
    // stg can be Strategy or String ID
    let stgElem = this._getElem(stg);

    if (stgElem) {
      $(stgElem).remove();
    }
  }
}
customElements.define("strategy-card-list", StrategyValueCardElementList, {extends: 'div'});

class StrategyValueCardElement extends HTMLDivElement {
  // Raises addstg, delstg and edtstg events
  constructor(stg=null, stgInEdit=false) {
    super();
    // element created

    this.stg = stg;
    this.className = "col mb-3";
    this.innerHTML = this.getValueCard(stg, stgInEdit);
  }

  getValueCard(stg, stgInEdit) {
    if (!stg) {
      this.id = Date.now();

      return `
      <div class="card shadow-sm">
        <div class="card-header">
          <div>Strategy
            <i class="bi-trash text-danger float-end" aria-label="Remove"></i> 
            <a class="bi-pencil-square text-primary float-end me-2" href="#/" aria-label="Edit" 
              onclick="this.dispatchEvent(new CustomEvent('addstg', {
                bubbles: true, calcelable: true }))">
            </a> 
          </div>
        </div> 
        <div class="card-body text-center">
          <h5 class="card-title text-success">
            <i class="bi bi-plus-square-dotted" 
            onclick="this.dispatchEvent(new CustomEvent('addstg', {
              bubbles: true, calcelable: true }))"></i>
          </h5>
          <span>Create New</span>
        </div> 
        <div class="card-footer text-muted"> 
          <small>&nbsp;</small> 
        </div> 
      </div>`;
    }

    let value = stg.curPosition.toFixed(2);
    this.id = stg.id;

    return `
      <div class="card shadow-sm">
        <div class="card-header">
          <div>${stg.name}
            <a class="bi-trash text-danger float-end" href="#/" 
              onclick="this.dispatchEvent(new CustomEvent('delstg', {
                bubbles: true, calcelable: true, detail: { stg: '${stg.id}' } 
              }))" aria-label="Remove"></a> 
            <a class="bi-pencil-square text-${stgInEdit ? "danger" : "primary"} float-end me-2" href="#/" aria-label="Edit" 
              onclick="this.dispatchEvent(new CustomEvent('edtstg', {
                bubbles: true, calcelable: true, detail: { stg: '${stg.id}' } 
              }))"></a> 
          </div>
        </div> 
        <div class="card-body text-center">
          <h5 class="card-title text-${value >= 0 ? "success" : "danger"}">${value}</h5>
          <span>${stg.count.toString()} Legs</span>
        </div> 
        <div class="card-footer text-center text-muted"> 
          <small>${new Date(stg.createTime).toLocaleString("en-IN")}</small> 
        </div> 
      </div>`;
  }

  connectedCallback() {
    // browser calls this method when the element is added to the document
    // (can be called many times if an element is repeatedly added/removed)
  }

  disconnectedCallback() {
    // browser calls this method when the element is removed from the document
    // (can be called many times if an element is repeatedly added/removed)
  }

  static get observedAttributes() {
    return [/* array of attribute names to monitor for changes */];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // called when one of attributes listed above is modified
  }

  adoptedCallback() {
    // called when the element is moved to a new document
    // (happens in document.adoptNode, very rarely used)
  }

  // there can be other element methods and properties
}
customElements.define("strategy-card", StrategyValueCardElement, {extends: 'div'});

class FuturesWatchCardElement extends HTMLDivElement {
  constructor(instrument) {
    super();
    
    if (!instrument.isFuture) {
      throw new Error(`Future Watch Card for [${instrument.sym.b}]!!`)
    }

    this.instrument = instrument;
    this.ltp = "NA";
    this.ltpdir = 0; // direction of ltp -ve (down), =ve (up), 0 (same)
    this.oi = "NA";
    this.className = 'col';
    this.innerHTML = this._getCard();
    
    this.update().catch(() => console.log("Unable to initial update the Futures Card") );
  }

  _getCard() {
    return `
        <div class="card shadow-sm mb-3">
          <div class="card-header">
            <span>${this.instrument.sym.c} ${this.instrument.expDisplay}
            <span class="float-end text-danger align-bottom"><small>FUT</small></span>
            </span>
          </div> 
          <div class="card-body">
            <div class="card-text">
              <div>OI : ${this.oi}</div>
              <div>LTP : 
                <span class=${this.ltpdir <= 0 ? (this.ltpdir < 0 ? "text-danger" : "") : "text-success"}>
                ${this.ltp}</span>
              </div>
            </div>
          </div>
        </div>`;
  }

  async update(newTS=null) {
    if (newTS) {
      this.instrument.simulationTS = newTS;
    }

    try {
      const resultList = await this.fetchRec(this.instrument);
      const one = resultList.one;
      let ltp = one.ltp;
      if (ltp) {
        ltp = ltp.toFixed(2);
        this.ltpdir = ltp - this.ltp;
        this.ltp = ltp;
      }
      if (one.oi) {
        this.oi = one.oi;
      }

      this.innerHTML = this._getCard();
    } catch(error) {
      console.log(error);
      throw error;
    }
  }

  async fetchRec(instrument) {
    const sym = instrument.sym;
    return await DBFacade.fetchRecs(sym.a, sym.b, sym.c,
    instrument.exp, Math.floor(instrument.simulationTS / 60000) * 60, null, null, null, null);
  }
}
customElements.define("futures-card", FuturesWatchCardElement, {extends: 'div'});

class IndexWatchCardElement extends HTMLDivElement {
  constructor(instrument) {
    super();
    
    if (!instrument.isIndex) {
      throw new Error(`Index Watch Card for [${instrument.sym.b}]!!`)
    }

    this.instrument = instrument;
    this.ltp = "NA";
    this.ltpdir = 0; // direction of ltp -ve (down), =ve (up), 0 (same)
    this.className = 'col';
    this.innerHTML = this._getCard();
    
    this.update().catch(() => console.log("Unable to initial update the Index Card") );
  }

  _getCard() {
    return `
        <div class="card shadow-sm mb-3">
          <div class="card-header">
            <span>${this.instrument.sym.c}
            </span>
            <span class="float-end text-danger align-bottom"><small>IDX</small></span>
          </div> 
          <div class="card-body">
            <div class="card-text">
              <div>IDX : 
                <span class=${this.ltpdir <= 0 ? (this.ltpdir < 0 ? "text-danger" : "") : "text-success"}>${this.ltp}</span>
              </div>
              <div>&nbsp;</div>
            </div>
          </div>
        </div>`;
  }

  async update(newTS=null) {
    if (newTS) {
      this.instrument.simulationTS = newTS;
    }

    try {
      const resultList = await this.fetchRec(this.instrument);
      const one = resultList.one;
      let ltp = one.ltp;
      if (ltp) {
        ltp = ltp.toFixed(2);
        this.ltpdir = ltp - this.ltp;
        this.ltp = ltp;
      }
      
      this.innerHTML = this._getCard();
    } catch(error) {
      console.log(error);
      throw error;
    }
  }

  async fetchRec(instrument) {
    const sym = instrument.sym;
    return await DBFacade.fetchRecs(sym.a, sym.b, sym.c, null,
      Math.floor(instrument.simulationTS / 60000) * 60, null, null, null, null);
  }
}
customElements.define("index-card", IndexWatchCardElement, {extends: 'div'});

class FuturesAndIndexCardsElement extends HTMLDivElement {
  constructor() {
    super();
  }

  getCard(instrument) {
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].instrument && instrument.isSame(this.children[i].instrument)) {
        return this.children[i];
      }
    }

    return null;
  }
  
  has(instrument) {
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].instrument && instrument.isSame(this.children[i].instrument)) {
        return true;
      }
    }

    return false;
  }

  append(instrument) {
    if (!instrument) {
      console.log("No instrument to make Card");
      return;
    }

    let card = this.getCard(instrument);
    if (card) {
      card.update(instrument.simulationTS);
      return;
    }

    if (instrument.isFuture) {
      card = new FuturesWatchCardElement(instrument);
    } else if (instrument.isIndex) {
      card = new IndexWatchCardElement(instrument);
    } else {
      throw new Error("Unsupported type of instrument for Watch List");
    }

    this.appendChild(card);
  }
  
  remove(instrument) {
    let card = this.getCard(instrument);
    this.removeChild(card);
  }

  clear() {
    while (this.firstChild) {
      this.removeChild(this.firstChild)
    }
  }

  updateAll(newTS) {
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].update(newTS);
    }
  }

  connectedCallback() {
    // browser calls this method when the element is added to the document
    // (can be called many times if an element is repeatedly added/removed)
  }

  disconnectedCallback() {
    // browser calls this method when the element is removed from the document
    // (can be called many times if an element is repeatedly added/removed)
  }

  static get observedAttributes() {
    return [/* array of attribute names to monitor for changes */];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // called when one of attributes listed above is modified
  }

  adoptedCallback() {
    // called when the element is moved to a new document
    // (happens in document.adoptNode, very rarely used)
  }
}
customElements.define("x-data-cards", FuturesAndIndexCardsElement, {extends: 'div'});

class OptionChainPresenter {
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

  getTableNode(chain) {
    if (!chain instanceof OptionChain) {
      throw new Error("Invalid Chain Object Type");
    }

    const nodata = "";
    const table = document.createElement("table");
    table.className = "table table-striped caption-top table-sm text-center";
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

    return table;
  }
}

class RecordListPresenter {
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

  getTableNode(records) {
    if (!records instanceof RecordList) {
      throw new Error("Invalid RecordList Object Type");
    }

    if (records.count == 0) {
      throw new Error("No records to present");
    }

    const table = document.createElement("table");
    table.className = "table caption-top table-sm table-bordered";
    table.style = "{ empty-cells: show; }";

    const caption = document.createElement("caption");
    caption.className = "text-center";
    caption.innerHTML = "<strong>" + records.sym.c + "</strong> Snapshots";
    table.appendChild(caption);

    const head = document.createElement("thead");
    head.appendChild(this.createTableRow(["Date-Time", "LTP", "Attr"], "th"));
    table.appendChild(head);

    const body = document.createElement("tbody");

    if (records.count > 1) {
      const tods = records.tods;
      const objects = records.objects;
      for (let i = 0; i < tods.length; i++) {
        const todrec = objects.get(tods[i]);     // One record per ts

        if (todrec.ltp) {
          body.appendChild(this.createTableRow([new Date(parseInt(todrec.tod) * 1000).toString(), todrec.ltp, ""]));
        }
      }
    } else {
      let record = records.one;
      if (record.ltp) {
        body.appendChild(this.createTableRow([new Date(parseInt(record.tod) * 1000).toString(), record.ltp, ""]));
      }
    }

    table.appendChild(body);
    
    return table;
  }
}