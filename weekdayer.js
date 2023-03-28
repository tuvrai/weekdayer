//Enum
const LimitMode =
{
    Time: 'Time',
    Try: 'Try',
    Unspecified: undefined
}

class Statser
{
    constructor(guesses)
    {
        this.guesses = guesses.filter(g => g.guessedId != undefined);
    }

    GetCorrectCount()
    {
        return this.guesses.filter(x => x.IsGuessedRight()).length;
    }

    GetElapsedTimeSum()
    {
        let sum = 0;
        this.guesses.forEach(g => {
            sum += g.GetTimeElapsed();
        });
        return sum;
    }

    GetStats()
    {
        const correct = this.GetCorrectCount();
        const timeSum = this.GetElapsedTimeSum();
        const count = this.guesses.length;
        return {
            correct: correct,
            wrong: count - correct,
            efficiency: correct / count,
            timeSum: timeSum,
            avgTime: timeSum / count
        }
    }
}

class OptionsTime
{
    constructor(min, sec)
    {
        this.min = min;
        this.sec = sec;
        this.endLabel = "Time elapsed";
    }

    Tick()
    {
        this.sec -= 1;
        if (this.sec == 0 && this.min == 0)
        {
            return true;
        }
        if (this.sec < 0)
        {
            this.min -= 1;
            this.sec = 59;
        }
        return false;
    }

    Start()
    {
        clearInterval(this.interval);
        document.getElementById('wdr-tries-max').innerText = '∞';
        RefreshTimeView();
        this.interval = setInterval(OnTick, 1000);
    }
}

class OptionsTry
{
    constructor(tries)
    {
        this.tries = tries;
        this.endLabel = "All tries done";
    }

    Start()
    {
        document.getElementById('wdr-tries-max').innerText = options.tries.toString();
    }
}

class Guess
{
    constructor(date)
    {
        this.date = date;
        this.weekdayId = date.getDay();
        this.guessedId = undefined;
        this.weekDayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
        this.startDate = new Date();
    }

    Evaluate(guessedId)
    {
        this.guessedId = guessedId;
        this.endDate = new Date();
        if (this.guessedId == this.weekdayId)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    GetTimeElapsed()
    {
        return (this.endDate - this.startDate)/1000;
    }

    IsGuessedRight()
    {
        return this.guessedId == this.weekdayId;
    }
    
    GetWeekDayName()
    {
        return this.weekDayNames[this.weekdayId];
    }

    GetGuessedWeekDayName()
    {
        return this.weekDayNames[this.guessedId];
    }

    GetDateString()
    {
        return this.date.toDateString().substring(4);
    }
}

function GetMode()
{
    const timeModeRadio = document.getElementById('limit-mode-time-input');
    const tryModeRadio = document.getElementById('limit-mode-try-input');
    if (timeModeRadio.checked)
    {
        return LimitMode.Time;
    }
    if (tryModeRadio.checked)
    {
        return LimitMode.Try;
    }
    return LimitMode.Unspecified;
}

function GetTimeOptions()
{
    const minuteLimit = parseInt(document.querySelector('.minutes-input').value);
    const secondsLimit = parseInt(document.querySelector('.seconds-input').value);
    if (isNaN(minuteLimit) || isNaN(secondsLimit))
    {
        throw new Error("Time parameter is not a number!");
    }
    return new OptionsTime(minuteLimit,secondsLimit);
}

function GetTryOptions()
{
    const tryLimitControls = document.getElementById('try-limit-controls');
    const triesAmount = tryLimitControls.querySelector('.try-limit-input').value;
    return new OptionsTry(triesAmount);
}

function GetRandomDate(start, end)
{
    if (start > end)
    {
        throw new Error("Start year should not be later than end year");
    }
    var startDate = new Date(start,0,1);
    var endDate = new Date(end+1,0,1);
    var date = new Date(+startDate + Math.random() * (endDate - startDate));
    return date;
}

let tryId = 0;
let options;
let guesses = [];
let isGuessing = false;

function ProduceTry()
{
    const currentDate = GetRandomDate(1600,2400);
    guesses.push(new Guess(currentDate));
    document.getElementById('random-date-text').innerText = currentDate.toDateString().substring(4);
}

function CreateGuessCell(text, color = "black")
{
    const el = document.createElement('td');
    el.innerText = text;
    el.style.color = color;
    return el;
}

function CreateGuessRow(id)
{
    const table = document.getElementById('guesses-list-table');
    row = document.createElement('tr');
    row.classList.add('guess-list-data-row');
    row.appendChild(CreateGuessCell(id+1));
    row.appendChild(CreateGuessCell(guesses[id].GetDateString()));
    row.appendChild(CreateGuessCell(guesses[id].GetWeekDayName()));
    row.appendChild(CreateGuessCell(guesses[id].GetGuessedWeekDayName(), guesses[id].IsGuessedRight() ? "green" : "red"));
    row.appendChild(CreateGuessCell(guesses[id].GetTimeElapsed().toString()));
    table.appendChild(row);
}

function ClearGuessTable()
{
    document.getElementById('guesses-list-table').querySelectorAll('.guess-list-data-row').forEach((r)=>r.remove());
}

function IsConfirmWeekdayBtn(target)
{
    return target.classList.contains('confirm-weekday');
}

function OnConfirmWeekdayClick(e)
{
    if (IsConfirmWeekdayBtn(e.target))
    {
        EvaluateWeekday(e.target.value);
    }
}

function EvaluateWeekday(value)
{
    guesses[tryId].Evaluate(value);
    CreateGuessRow(tryId);
    if(options.constructor.name == 'OptionsTry')
    {
        OnNextWhenTries();
    }
    else
    {
        OnNextWhenTimed()
    }
}

function OnNextWhenTimed()
{
    ++tryId;
    OnNext();
}

function OnNextWhenTries()
{
    if (++tryId < options.tries)
    {
        OnNext();
    }
    else
    {
        OnEnd();
    }
}

function OnNext()
{
    document.getElementById('wdr-tries-count').innerText = (tryId+1).toString();
    ShowStats();
    ProduceTry();
}

function OnEnd()
{
    isGuessing = false;
    document.getElementById('random-date-text').innerText = options.endLabel;
    document.getElementById('wdr-select-day').removeEventListener('click',OnConfirmWeekdayClick);
    ShowStats();
    [...document.getElementById('wdr-select-day').querySelectorAll('.confirm-weekday')].forEach((el)=>{
        el.style.visibility = 'collapse';
    });
}

function ShowStats()
{
    const stats = new Statser(guesses).GetStats();
    document.getElementById('stat-correct-value').innerText = stats.correct.toString();
    document.getElementById('stat-wrong-value').innerText = stats.wrong.toString();
    document.getElementById('stat-efficiency-value').innerText = stats.efficiency.toPrecision(4).toString();
    document.getElementById('stat-timeelapsed-value').innerText = stats.timeSum.toPrecision(4).toString();
    document.getElementById('stat-avgtime-value').innerText = stats.avgTime.toPrecision(4).toString();
}

function PrepareNewGame()
{
    guesses = [];
    tryId = 0;
    ClearGuessTable();
    isGuessing = true;
    document.getElementById('wdr-select-day').addEventListener('click',OnConfirmWeekdayClick);
    ProduceTry();
    document.getElementById('wdr-tries-count').innerText = (tryId+1).toString();
    [...document.getElementById('wdr-select-day').querySelectorAll('.confirm-weekday')].forEach((el)=>{
        el.style.visibility = 'visible';
    });
}

function RefreshTimeView()
{
    document.querySelector('.time-limit-countdown-text').innerText = `${options.min.toString().padStart(2,'0')}:${options.sec.toString().padStart(2,'0')}`;
}

function OnTick()
{
    if (options.Tick())
    {
        OnEnd();
        clearInterval(options.interval);
    }
    RefreshTimeView();
}

function Start()
{
    const mode = GetMode();
    if (mode != LimitMode.Unspecified)
    {
        PrepareNewGame();
        options = mode == LimitMode.Time ? GetTimeOptions() : GetTryOptions();
        options.Start();
    }
}

function OnKeyDown(e)
{
    if (document.activeElement.nodeName != "INPUT")
    {
        const number = e.key == '`' ? 0 : parseInt(e.key);
        if(isGuessing && !isNaN(number))
        {
            EvaluateWeekday(number % 7);
        }
    }
}

function Main()
{
    document.getElementById('start-session-btn').addEventListener('click', Start);
}

document.addEventListener('DOMContentLoaded',Main);
document.addEventListener('keydown',OnKeyDown);