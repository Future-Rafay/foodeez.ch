import Separator from "@/components/ui/separator";
// import { isOpenNow } from "@/lib/isOpenNow";
import { OpeningHourDay } from "@/types/google-business";
import { format } from "date-fns";
import { Clock } from "lucide-react";

type OpeningHoursProps = {
  openingHours: OpeningHourDay[];
};

const OpeningHours: React.FC<OpeningHoursProps> = ({ openingHours }) => {
  if (!openingHours || openingHours.length === 0) return null;

  const currentDay = format(new Date(), "EEEE");
  // const openNow = isOpenNow(openingHours);

  return (
    <>
      <Separator />
      <div className="py-8 px-4 lg:px-0">
        <div className="">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center sub-heading">
              <h2>Opening Hours</h2>
              <Clock className="ml-2" size={48} />
            </div>

            {/* <span
              className={`px-4 py-1 rounded-full text-base font-medium text-text-main ${
                openNow ? "bg-highlight" : "bg-highlight-light"
              }`}
            >
              {openNow ? "Now Open" : "Now Closed"}
            </span> */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openingHours.map((item, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-3 rounded-lg border ${
                  item.day === currentDay
                    ? "bg-secondary/5 border-primary"
                    : "border-gray-200"
                }`}
              >
                <span
                  className={`font-medium ${
                    item.day === currentDay ? "text-primary" : "text-gray-700"
                  }`}
                >
                  {item.day}
                </span>

                <div className="flex flex-wrap gap-1 items-end">
                  {item.hours.split(",").map((period, i) => (
                    <span
                      key={i}
                      className="text-gray-700 px-2 py-0.5 rounded text-base"
                    >
                      {period.trim()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default OpeningHours;