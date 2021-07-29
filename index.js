function getDateWithLeadingZero() {
    const dateObj = new Date();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getUTCDate()).padStart(2, '0')
    const year = dateObj.getUTCFullYear();
    return { year, month, day }
}
function getDaysPassedOnMonthRange() {
    const { year, month, day } = getDateWithLeadingZero()
    const start = `${year}-${month}-01`
    const end = `\`${year}-${month}-${day}`
    return { start, end }
}
async function getApprovedPoints() {
    const { year, month } = getDateWithLeadingZero()
    const data = await fetch(`https://www.ahgora.com.br/api-espelho/apuracao/${year}-${month}`, {
        method: 'GET',
        credentials: 'include'
    })
    const { dias } = await data.json()
    return dias
}
async function getTicketsToBeApproved() {
    const { start, end } = getDaysPassedOnMonthRange()
    const response = await fetch(`https://www.ahgora.com.br/api-espelho/justificativas?inicio=${start}&fim=${end}`, {
        method: 'GET',
        credentials: 'include'
    })
    const { data } = await response.json()
    return data
}
function addTimes (startTime, endTime) {
    const start = startTime.split(':')
    const end = endTime.split(':')

    const originalDate = new Date(2000, 1, 2, 0, 0, 0)
    const date = new Date(originalDate)
    date.setHours(date.getHours() + (+start[0] + +end[0]))

    function getMinutesWithSignal(originalTime) {
        const minutes = originalTime.split(":")[1]
        const isNegativeHour = originalTime[0] === "-"
        if (isNegativeHour) return +("-" + minutes)
        else return +minutes
    }
    const startMinutes = getMinutesWithSignal(startTime)
    const endMinutes = getMinutesWithSignal(endTime)

    date.setMinutes(date.getMinutes() + (startMinutes + endMinutes))

    const isNegativeHour = date.getDate() !== 2
    if(isNegativeHour) {
        const secondsDiff = Math.floor((originalDate - date) / 1000)
        const minutesDiff = Math.floor(secondsDiff / 60)

        const hoursDiff = minutesDiff / 60 << 0
        return "-" + String(hoursDiff).padStart(2, '0') + ':' + String(minutesDiff % 60).padStart(2, '0')
    }

    return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0')
}
function getTimeDifference (startTime, endTime) {
    const start = startTime.split(':')
    const end = endTime.split(':')

    const startDate = new Date(2000, 1, 2, Math.abs(+start[0]), +start[1], 0)
    const endDate = new Date(2000, 1, 2, Math.abs(+end[0]), +end[1], 0)

    const secondsDiff = Math.floor((endDate - startDate) / 1000)
    const minutesDiff = Math.floor(secondsDiff / 60)

    const hoursDiff = minutesDiff / 60 << 0

    const minusSignal = minutesDiff < 0 ? "-" : ""
    const formattedHours = String(Math.abs(hoursDiff)).padStart(2, '0')
    const formattedMinutes = String(Math.abs(minutesDiff % 60)).padStart(2, '0')
    return minusSignal + formattedHours + ':' + formattedMinutes
}
function handleTotalApprovedHours(days, tickets) {
    tickets.forEach(ticket => {
        const day = days[ticket.referencia]
        day.batidas = [...day.batidas, {hora: ticket.addPunch.hora}]
    })
    return days
}
function clearMergedData(mergedData) {
    return Object.keys(mergedData).reduce((acc, dataKey) => {
        const daysObj = mergedData[dataKey].batidas
        const days = daysObj.map(dayObj => dayObj.hora).sort()

        return [...acc, days]
    }, []).filter(day => {
        if (day.length === 0) return false
        if((day.length % 2) !== 0) return false
        if(day.includes("")) return false
        return true
    })
}
function getTotalHours(data) {
    let total = "00:00"
    data.map(day => {
        let totalDay = "00:00"
        for(let i = 0; i < day.length; i += 2) {
            if(day[i] && day[i+1]) {
                totalDay = addTimes(totalDay, getTimeDifference(day[i], day[i+1]))
            }
        }
        total = addTimes(total, getTimeDifference(totalDay, "08:48"))
    })
    return total
}
(async function() {
    let confirmedDays = await getApprovedPoints()
    const toAproveTickets = await getTicketsToBeApproved()

    const mergedData = handleTotalApprovedHours(confirmedDays, toAproveTickets)
    const data = clearMergedData(mergedData)
    const totalHours = getTotalHours(data)

    console.log({mergedData, data, totalHours})
})()
