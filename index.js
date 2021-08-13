function integerToStringWithPadding(integer) {
    return String(integer).padStart(2, '0');
  }
  function timeToMinutes(time) {
    const isNegative = time[0] === '-';
    const absoluteTime = isNegative ? time.slice(1, time.length) : time;
  
    const [absoluteHours, absoluteMinutes] = absoluteTime.split(':');
    const totalMinutes = absoluteHours * 60 + +absoluteMinutes;
  
    return isNegative ? totalMinutes * -1 : totalMinutes;
  }
  function minutesToTime(minutesInput) {
    const isNegative = minutesInput < 0;
    const absoluteMinutes = isNegative ? minutesInput * -1 : minutesInput;
  
    const hoursAmount = Math.floor(absoluteMinutes / 60);
    const minutesAmount = absoluteMinutes - hoursAmount * 60;
  
    const negativeSignal = isNegative ? '-' : '';
    const hours = integerToStringWithPadding(hoursAmount);
    const minutes = integerToStringWithPadding(minutesAmount);
  
    return negativeSignal + hours + ':' + minutes;
  }
  function addTimes(startTime, endTime) {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
  
    const totalMinutes = startMinutes + endMinutes;
  
    return minutesToTime(totalMinutes);
  }
  function getDateWithLeadingZero() {
    const dateObj = new Date();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    const year = dateObj.getUTCFullYear();
    return { year, month, day };
  }
  function getDaysPassedOnMonthRange() {
    const { year, month, day } = getDateWithLeadingZero();
    const start = `${year}-${month}-01`;
    const end = `\`${year}-${month}-${day}`;
    return { start, end };
  }
  async function getApprovedPoints() {
    const { year, month } = getDateWithLeadingZero();
    const data = await fetch(
      `https://www.ahgora.com.br/api-espelho/apuracao/${year}-${month}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    const { dias } = await data.json();
    return dias;
  }
  async function getTicketsToBeApproved() {
    const { start, end } = getDaysPassedOnMonthRange();
    const response = await fetch(
      `https://www.ahgora.com.br/api-espelho/justificativas?inicio=${start}&fim=${end}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    const { data } = await response.json();
    return data;
  }
  function handleTotalApprovedHours(days, tickets) {
    tickets.forEach((ticket) => {
      const day = days[ticket.referencia];
      day.batidas = [...day.batidas, { hora: ticket.addPunch.hora }];
    });
    return days;
  }
  function clearMergedData(mergedData) {
    return Object.keys(mergedData)
      .reduce((acc, dataKey) => {
        const daysObj = mergedData[dataKey].batidas;
        const days = daysObj.map((dayObj) => dayObj.hora).sort();
  
        return [...acc, days];
      }, [])
      .filter((day) => {
        if (day.length === 0) return false;
        if (day.length % 2 !== 0) return false;
        if (day.includes('')) return false;
        return true;
      });
  }
  function getTotalHours(data) {
    let total = '00:00';
    data.map((day) => {
      let totalDay = '00:00';
      for (let i = 0; i < day.length; i += 2) {
        if (day[i] && day[i + 1]) {
          const periodDifference = addTimes(day[i + 1], '-' + day[i]);
          totalDay = addTimes(totalDay, periodDifference);
        }
      }
  
      const totalDayBalance = addTimes(totalDay, '-08:48');
      total = addTimes(total, totalDayBalance);
    });
    return total;
  }
  
  (async function () {
    let confirmedDays = await getApprovedPoints();
    const toAproveTickets = await getTicketsToBeApproved();
  
    const mergedData = handleTotalApprovedHours(confirmedDays, toAproveTickets);
    const data = clearMergedData(mergedData);
  
    const totalHours = getTotalHours(data);
  
    console.log({ mergedData, data, totalHours });
  })();
  