// TODO: replace headlessui with radix-ui
import { Menu, Transition } from "@headlessui/react";
import { BanIcon, CalendarIcon, CheckIcon, ClockIcon, XIcon } from "@heroicons/react/outline";
import { DotsHorizontalIcon } from "@heroicons/react/solid";
import { BookingStatus } from "@prisma/client";
import dayjs from "dayjs";
import { Fragment } from "react";
import { useMutation } from "react-query";

import classNames from "@lib/classNames";
import { HttpError } from "@lib/core/http/error";
import { inferQueryOutput, trpc } from "@lib/trpc";

import EmptyScreen from "@components/EmptyScreen";
import Loader from "@components/Loader";
import Shell from "@components/Shell";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";

type BookingItem = inferQueryOutput<"viewer.bookings">[number];

function BookingListItem(booking: BookingItem) {
  const utils = trpc.useContext();
  const mutation = useMutation(
    async (confirm: boolean) => {
      const res = await fetch("/api/book/confirm", {
        method: "PATCH",
        body: JSON.stringify({ id: booking.id, confirmed: confirm }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        throw new HttpError({ statusCode: res.status });
      }
    },
    {
      async onSettled() {
        await utils.invalidateQuery(["viewer.bookings"]);
      },
    }
  );
  return (
    <tr>
      <td className={"px-6 py-4" + (booking.rejected ? " line-through" : "")}>
        {!booking.confirmed && !booking.rejected && (
          <span className="mb-2 inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-medium bg-yellow-100 text-yellow-800">
            Unconfirmed
          </span>
        )}
        <div className="text-sm text-neutral-900 font-medium  truncate max-w-60 md:max-w-96">
          {booking.eventType?.team && <strong>{booking.eventType.team.name}: </strong>}
          {booking.title}
        </div>
        <div className="sm:hidden">
          <div className="text-sm text-gray-900">
            {dayjs(booking.startTime).format("D MMMM YYYY")}:{" "}
            <small className="text-sm text-gray-500">
              {dayjs(booking.startTime).format("HH:mm")} - {dayjs(booking.endTime).format("HH:mm")}
            </small>
          </div>
        </div>
        {booking.attendees.length !== 0 && (
          <div className="text-sm text-blue-500">
            <a href={"mailto:" + booking.attendees[0].email}>{booking.attendees[0].email}</a>
          </div>
        )}
      </td>
      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{dayjs(booking.startTime).format("D MMMM YYYY")}</div>
        <div className="text-sm text-gray-500">
          {dayjs(booking.startTime).format("HH:mm")} - {dayjs(booking.endTime).format("HH:mm")}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {!booking.confirmed && !booking.rejected && (
          <>
            <div className="space-x-2 hidden lg:block">
              <Button
                onClick={() => mutation.mutate(true)}
                StartIcon={CheckIcon}
                color="secondary"
                disabled={mutation.isLoading}>
                Confirm
              </Button>
              <Button
                onClick={() => mutation.mutate(false)}
                StartIcon={BanIcon}
                color="secondary"
                disabled={mutation.isLoading}>
                Reject
              </Button>
            </div>
            <Menu as="div" className="inline-block lg:hidden text-left ">
              {({ open }) => (
                <>
                  <div>
                    <Menu.Button className="text-neutral-400 mt-1 p-2 border border-transparent hover:border-gray-200">
                      <span className="sr-only">Open options</span>
                      <DotsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                    </Menu.Button>
                  </div>
                  <Transition
                    show={open}
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95">
                    <Menu.Items
                      static
                      className="origin-top-right absolute right-0 mt-2 w-56 rounded-sm shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-neutral-100">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <span
                              onClick={() => mutation.mutate(true)}
                              className={classNames(
                                active ? "bg-neutral-100 text-neutral-900" : "text-neutral-700",
                                "group flex items-center px-4 py-2 text-sm font-medium"
                              )}>
                              <CheckIcon
                                className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-500"
                                aria-hidden="true"
                              />
                              Confirm
                            </span>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <span
                              onClick={() => mutation.mutate(false)}
                              className={classNames(
                                active ? "bg-neutral-100 text-neutral-900" : "text-neutral-700",
                                "group flex items-center px-4 py-2 text-sm w-full font-medium"
                              )}>
                              <BanIcon
                                className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-500"
                                aria-hidden="true"
                              />
                              Reject
                            </span>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>
          </>
        )}
        {booking.confirmed && !booking.rejected && (
          <>
            <div className="space-x-2 hidden lg:block">
              <Button
                data-testid="cancel"
                href={"/cancel/" + booking.uid}
                StartIcon={XIcon}
                color="secondary">
                Cancel
              </Button>
              <Button href={"reschedule/" + booking.uid} StartIcon={ClockIcon} color="secondary">
                Reschedule
              </Button>
            </div>
            <Menu as="div" className="inline-block lg:hidden text-left ">
              {({ open }) => (
                <>
                  <div>
                    <Menu.Button className="text-neutral-400 mt-1 p-2 border border-transparent hover:border-gray-200">
                      <span className="sr-only">Open options</span>
                      <DotsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                    </Menu.Button>
                  </div>

                  <Transition
                    show={open}
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95">
                    <Menu.Items
                      static
                      className="origin-top-right absolute right-0 mt-2 w-56 rounded-sm shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-neutral-100">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href={process.env.NEXT_PUBLIC_APP_URL + "/../cancel/" + booking.uid}
                              className={classNames(
                                active ? "bg-neutral-100 text-neutral-900" : "text-neutral-700",
                                "group flex items-center px-4 py-2 text-sm font-medium"
                              )}>
                              <XIcon
                                className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-500"
                                aria-hidden="true"
                              />
                              Cancel
                            </a>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href={process.env.NEXT_PUBLIC_APP_URL + "/../reschedule/" + booking.uid}
                              className={classNames(
                                active ? "bg-neutral-100 text-neutral-900" : "text-neutral-700",
                                "group flex items-center px-4 py-2 text-sm w-full font-medium"
                              )}>
                              <ClockIcon
                                className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-500"
                                aria-hidden="true"
                              />
                              Reschedule
                            </a>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>
          </>
        )}
        {!booking.confirmed && booking.rejected && <div className="text-sm text-gray-500">Rejected</div>}
      </td>
    </tr>
  );
}

export default function Bookings() {
  const query = trpc.useQuery(["viewer.bookings"]);
  const bookings = query.data;

  return (
    <Shell heading="Bookings" subtitle="See upcoming and past events booked through your event type links.">
      <div className="-mx-4 sm:mx-auto flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            {query.status === "error" && (
              <Alert severity="error" title="Something went wrong" message={query.error.message} />
            )}
            {query.status === "loading" && <Loader />}
            {bookings &&
              (bookings.length === 0 ? (
                <EmptyScreen
                  Icon={CalendarIcon}
                  headline="No upcoming bookings, yet"
                  description="You have no upcoming bookings. As soon as someone books a time with you it will show up here."
                />
              ) : (
                <div className="border border-gray-200 overflow-hidden border-b rounded-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="bg-white divide-y divide-gray-200" data-testid="bookings">
                      {bookings
                        .filter((booking) => booking.status !== BookingStatus.CANCELLED)
                        .map((booking) => (
                          <BookingListItem key={booking.id} {...booking} />
                        ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
