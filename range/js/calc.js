function calc_range(T, index, vix) {
  if (isNaN(index) || isNaN(vix) || index <= 0 || vix <= 0) {
    throw new Error("Index and VIX cannot be Empty, (-)ve or Zero");
  }
  
  let pct_mvmnt = vix / Math.sqrt(T);
  
  return {
    pct_mvmnt: pct_mvmnt,
    high     : parseInt(index) + index * (pct_mvmnt / 100),
    low      : index - index * (pct_mvmnt / 100)
  };
}

function update_ranges(index, vix) {
  let range = calc_range(1, index, vix);
  document.getElementById("yr-pct").innerHTML = range.pct_mvmnt.toFixed(2);
  document.getElementById("yr-high").innerHTML = Math.round(range.high);
  document.getElementById("yr-low").innerHTML = Math.round(range.low);

  range = calc_range(12, index, vix);
  document.getElementById("mt-pct").innerHTML = range.pct_mvmnt.toFixed(2);
  document.getElementById("mt-high").innerHTML = Math.round(range.high);
  document.getElementById("mt-low").innerHTML = Math.round(range.low);

  range = calc_range(52, index, vix);
  document.getElementById("wk-pct").innerHTML = range.pct_mvmnt.toFixed(2);
  document.getElementById("wk-high").innerHTML = Math.round(range.high);
  document.getElementById("wk-low").innerHTML = Math.round(range.low);

  range = calc_range(365, index, vix);
  document.getElementById("day-pct").innerHTML = range.pct_mvmnt.toFixed(2);
  document.getElementById("day-high").innerHTML = Math.round(range.high);
  document.getElementById("day-low").innerHTML = Math.round(range.low);

  let oth_days = document.getElementById("oth-days").value
  let oth_t = Math.round(365/oth_days);
  document.getElementById("oth-t").innerHTML = oth_t;
  range = calc_range(oth_t, index, vix);
  document.getElementById("oth-pct").innerHTML = range.pct_mvmnt.toFixed(2);
  document.getElementById("oth-high").innerHTML = Math.round(range.high);
  document.getElementById("oth-low").innerHTML = Math.round(range.low);
}

function update_table() {
  try {
    let error_msg = document.getElementById("error-msg");
    error_msg.hidden = true;
    update_ranges( document.getElementById("index-cur").value, document.getElementById("india-vix").value );
  } catch (excp) {
    let error_msg = document.getElementById("error-msg");
    if (error_msg.hidden == true) {
      error_msg.hidden = false;
      error_msg.innerHTML = excp.message;
    }
  }

  return false;
}
