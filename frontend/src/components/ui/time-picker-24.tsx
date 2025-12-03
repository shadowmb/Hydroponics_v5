import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

interface TimePicker24Props {
    value: string; // HH:mm
    onChange: (value: string) => void;
    className?: string;
}

export function TimePicker24({ value, onChange, className }: TimePicker24Props) {
    const [hours, minutes] = value ? value.split(':') : ['00', '00'];

    const handleHourChange = (newHour: string) => {
        onChange(`${newHour}:${minutes}`);
    };

    const handleMinuteChange = (newMinute: string) => {
        onChange(`${hours}:${newMinute}`);
    };

    const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <Select value={hours} onValueChange={handleHourChange}>
                <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                    {hourOptions.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <span className="text-muted-foreground font-bold">:</span>
            <Select value={minutes} onValueChange={handleMinuteChange}>
                <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                    {minuteOptions.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
