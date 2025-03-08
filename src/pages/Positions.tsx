import { useState, useEffect, useCallback } from "react";
import joinourteam from "@/assets/img/stock/joinourteam.jpeg";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogClose,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Check,
  ChevronsUpDown,
  Clipboard,
  Edit,
  Loader2,
  X,
  Shield,
  Plus,
  Trash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { toast, Toaster } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

type Position = {
  label: string;
  form_url: string;
  is_accepting_responses: boolean;
};

type ActionType = "update" | "add" | "delete" | null;

const fallbackPositions: Position[] = [
  {
    label: "Senior Executive Team",
    form_url:
      "https://docs.google.com/forms/d/e/1FAIpQLSeIAQWf8BCJUbN71X8RQgkvo8rmZA-j5JlFoBgM75JOV3yy1Q/viewform?usp=sf_link",
    is_accepting_responses: true,
  },
  {
    label: "Junior Executive Team",
    form_url:
      "https://docs.google.com/forms/d/e/1FAIpQLSeLKmqK6ibtHO8HfItMOioxKjP5kmHdHzQFd4DtF6I3SLpiUg/viewform?usp=sf_link",
    is_accepting_responses: true,
  },
  {
    label: "Dance Instructor",
    form_url:
      "https://docs.google.com/forms/d/e/1FAIpQLScTk4EakTgfma8fo72t0mJugyb5VFeL5sEKBlm_A_hXnK4WUg/viewform?usp=sf_link",
    is_accepting_responses: true,
  },
  {
    label: "Performance Team",
    form_url:
      "https://docs.google.com/forms/d/e/1FAIpQLSdDBK_xgyeub7Przux1Lle2Ax-c_BDmN0B79Qpf7nKK-PJaXA/viewform?usp=sf_link",
    is_accepting_responses: true,
  },
  {
    label: "Cameraman",
    form_url:
      "https://docs.google.com/forms/d/e/1FAIpQLScVl_PS4pdEdQ_4HwN6OO761pMiz7moYdwuyBTdnEsGE2dj3A/viewform?usp=sf_link",
    is_accepting_responses: true,
  },
];

const positionSchema = z.object({
  label: z.string().min(1, "Position name is required"),
  form_url: z.string().url("Must be a valid URL"),
  is_accepting_responses: z.boolean().default(true),
});

export default function Positions() {
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string>("");
  const [formClosed, setFormClosed] = useState<boolean>(false);
  const [positionsData, setPositionsData] =
    useState<Position[]>(fallbackPositions);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();

  // Admin dialog states
  const [actionTypeOpen, setActionTypeOpen] = useState<boolean>(false);
  const [positionSelectOpen, setPositionSelectOpen] = useState<boolean>(false);
  const [selectedAction, setSelectedAction] = useState<ActionType>(null);
  const [selectedAdminPosition, setSelectedAdminPosition] =
    useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Position form using react-hook-form with zod validation
  const form = useForm<z.infer<typeof positionSchema>>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      label: "",
      form_url: "",
      is_accepting_responses: true,
    },
  });

  const fetchFormStatuses = useCallback(async (positions: Position[]) => {
    setIsLoading(true);
    try {
      const updatedPositions = await Promise.all(
        positions.map((position) => checkFormStatus(position))
      );
      setPositionsData(updatedPositions);
    } catch (error) {
      console.error("Error fetching form statuses:", error);
      // If the overall Promise.all fails, still update the state with the provided positions
      setPositionsData(positions);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPositionFromDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Fetch error details:", error);
        throw error;
      }

      const positions = data && data.length > 0 ? data : fallbackPositions;
      // Pass the positions directly to fetchFormStatuses instead of setting state
      await fetchFormStatuses(positions);
    } catch (error) {
      console.error("Error fetching positions from database:", error);
      // Use fallback positions if database fetch fails
      await fetchFormStatuses(fallbackPositions);
    }
  }, [fetchFormStatuses]);

  // Function to check if a form is still accepting responses using AllOrigins
  const checkFormStatus = async (position: Position) => {
    try {
      // Using allorigins.win as the CORS proxy
      const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        position.form_url
      )}`;
      const response = await fetch(allOriginsUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      // Check if the form contains the text indicating it's closed
      // Google Forms typically shows "This form is no longer accepting responses" when closed
      const is_accepting_responses = !text.includes(
        "no longer accepting response"
      );

      console.log(
        `Form status for ${position.label}: ${
          is_accepting_responses ? "Open" : "Closed"
        }`
      );

      return {
        ...position,
        is_accepting_responses,
      };
    } catch (error) {
      console.error(
        `Failed to check form status for ${position.label}:`,
        error
      );
      // In case of error, assume the form is still open to avoid false negatives
      return {
        ...position,
        is_accepting_responses: true,
      };
    }
  };

  // Handle form submission based on action type
  const handleSubmit = async (data: z.infer<typeof positionSchema>) => {
    setIsSubmitting(true);
    try {
      if (selectedAction === "add") {
        // Add position to database
        const { error } = await supabase.from("positions").insert([
          {
            ...data,
            user_id: user?.id,
          },
        ]);

        if (error) throw error;
        toast.success("Position added successfully!");
      } else if (selectedAction === "update") {
        // Update position in database
        const position = positionsData.find(
          (p) =>
            p.label.toLowerCase().replace(/\s+/g, "") === selectedAdminPosition
        );

        if (!position) throw new Error("Position not found");

        const { error } = await supabase
          .from("positions")
          .update(data)
          .eq("label", position.label);

        if (error) throw error;
        toast.success("Position updated successfully!");
      }

      // Refresh positions data
      await fetchPositionFromDatabase();

      // Reset states
      setSelectedAction(null);
      setSelectedAdminPosition("");
    } catch (error) {
      console.error("Error managing position:", error);
      toast.error("Failed to manage position");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle position deletion
  const handleDeletePosition = async () => {
    setIsSubmitting(true);
    try {
      const position = positionsData.find(
        (p) =>
          p.label.toLowerCase().replace(/\s+/g, "") === selectedAdminPosition
      );

      if (!position) throw new Error("Position not found");

      const { error } = await supabase
        .from("positions")
        .delete()
        .eq("label", position.label);

      if (error) throw error;

      toast.success("Position deleted successfully!");
      await fetchPositionFromDatabase();

      // Reset states
      setSelectedAction(null);
      setSelectedAdminPosition("");
    } catch (error) {
      console.error("Error deleting position:", error);
      toast.error("Failed to delete position");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check all form status when component mounts
  useEffect(() => {
    fetchPositionFromDatabase();
  }, [fetchPositionFromDatabase]);

  // Update formClosed status when value changes
  useEffect(() => {
    if (value) {
      const selectedPosition = positionsData.find(
        (p) => p.label.toLowerCase().replace(/\s+/g, "") === value
      );
      setFormClosed(
        selectedPosition ? !selectedPosition.is_accepting_responses : false
      );
    } else {
      setFormClosed(false);
    }
  }, [value, positionsData]);

  useEffect(() => {
    if (value) {
      const selectedPosition = positionsData.find(
        (p) => p.label.toLowerCase().replace(/\s+/g, "") === value
      );
      setFormClosed(
        selectedPosition ? !selectedPosition.is_accepting_responses : false
      );
    } else {
      setFormClosed(false);
    }
  }, [value, positionsData]);

  // Set form values when editing a position
  useEffect(() => {
    if (selectedAction === "update" && selectedAdminPosition) {
      const position = positionsData.find(
        (p) =>
          p.label.toLowerCase().replace(/\s+/g, "") === selectedAdminPosition
      );
      if (position) {
        form.reset({
          label: position.label,
          form_url: position.form_url,
          is_accepting_responses: position.is_accepting_responses,
        });
      }
    } else if (selectedAction === "add") {
      // Reset form when adding a new position
      form.reset({
        label: "",
        form_url: "",
        is_accepting_responses: true,
      });
    }
  }, [selectedAction, selectedAdminPosition, positionsData, form]);

  return (
    <div className="animate-fade-in overflow-x-hidden">
      <div className="w-screen h-screen relative">
        <img
          className="absolute inset-0 object-cover w-full h-full brightness-[0.25]"
          src={joinourteam}
          alt="team"
        />

        <div className="relative flex flex-col justify-center items-center h-full p-4 text-white space-y-4">
          <div>
            <h1 className="text-3xl font-bold lg:text-4xl text-center my-5 text-lightblue-100">
              Find out what position fits you!
            </h1>
            <p className="text-xl lg:paragraph text-center max-w-screen-sm">
              We have a variety of positions available for you to join! Whether
              you're interested in dancing, videography, or graphic design, we
              have a spot for you.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            {/* Edit Positions Section */}
            {user && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="cursor-pointer" variant="secondary">
                    <Shield />
                    Edit Positions
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[350px] lg:w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Manage Positions</DialogTitle>
                    <DialogDescription>
                      Add, update or delete position information
                    </DialogDescription>
                  </DialogHeader>

                  {/* Action Type Selection */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col space-y-2">
                      <Label>Select Action:</Label>
                      <Popover
                        open={actionTypeOpen}
                        onOpenChange={setActionTypeOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={actionTypeOpen}
                            className="justify-between cursor-pointer"
                          >
                            {selectedAction
                              ? selectedAction === "add"
                                ? "Add Position"
                                : selectedAction === "update"
                                ? "Update Position"
                                : "Delete Position"
                              : "Select action..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <div className="rounded-md border">
                            <div
                              className={cn(
                                "cursor-pointer relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                selectedAction === "add"
                                  ? "bg-accent text-accent-foreground"
                                  : "transparent"
                              )}
                              onClick={() => {
                                setSelectedAction("add");
                                setActionTypeOpen(false);
                                setSelectedAdminPosition("");
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Add Position
                            </div>
                            <Separator />
                            <div
                              className={cn(
                                "cursor-pointer relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                selectedAction === "update"
                                  ? "bg-accent text-accent-foreground"
                                  : "transparent"
                              )}
                              onClick={() => {
                                setSelectedAction("update");
                                setActionTypeOpen(false);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Update Position
                            </div>
                            <Separator />
                            <div
                              className={cn(
                                "cursor-pointer relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                selectedAction === "delete"
                                  ? "bg-accent text-accent-foreground"
                                  : "transparent"
                              )}
                              onClick={() => {
                                setSelectedAction("delete");
                                setActionTypeOpen(false);
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete Position
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Position Selection (only for update and delete) */}
                    {(selectedAction === "update" ||
                      selectedAction === "delete") && (
                      <div className="flex flex-col space-y-2">
                        <Label>Select Position:</Label>
                        <Popover
                          open={positionSelectOpen}
                          onOpenChange={setPositionSelectOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={positionSelectOpen}
                              className="justify-between cursor-pointer"
                            >
                              {selectedAdminPosition
                                ? positionsData.find(
                                    (p) =>
                                      p.label
                                        .toLowerCase()
                                        .replace(/\s+/g, "") ===
                                      selectedAdminPosition
                                  )?.label || "Select position..."
                                : "Select position..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <div className="rounded-md border max-h-[200px] overflow-y-auto">
                              {positionsData.map((position) => {
                                const positionValue = position.label
                                  .toLowerCase()
                                  .replace(/\s+/g, "");
                                return (
                                  <div key={positionValue}>
                                    <div
                                      className={cn(
                                        "cursor-pointer relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                        selectedAdminPosition === positionValue
                                          ? "bg-accent text-accent-foreground"
                                          : "transparent"
                                      )}
                                      onClick={() => {
                                        setSelectedAdminPosition(positionValue);
                                        setPositionSelectOpen(false);
                                      }}
                                    >
                                      {position.label}
                                      {selectedAdminPosition ===
                                        positionValue && (
                                        <Check className="ml-auto h-4 w-4" />
                                      )}
                                    </div>
                                    <Separator />
                                  </div>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}

                    {/* Form for Add or Update */}
                    {(selectedAction === "add" ||
                      (selectedAction === "update" &&
                        selectedAdminPosition)) && (
                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(handleSubmit)}
                          className="space-y-4"
                        >
                          <FormField
                            control={form.control}
                            name="label"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter position name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-2">
                            <FormField
                              control={form.control}
                              name="form_url"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Form URL</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="https://docs.google.com/forms/d/e/..."
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Label className="text-muted-foreground font-normal">
                              Forms from Google Forms will be automatically
                              checked for availability.
                            </Label>
                          </div>

                          <div className="flex justify-end gap-2">
                            <DialogClose asChild>
                              <Button type="button" variant="outline">
                                Close
                              </Button>
                            </DialogClose>
                            <Button
                              type="submit"
                              variant="default"
                              disabled={isSubmitting}
                            >
                              {isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              {selectedAction === "add"
                                ? "Add Position"
                                : "Update Position"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    )}
                  </div>
                  <DialogFooter>
                    {/* Delete Confirmation */}
                    {selectedAction === "delete" && selectedAdminPosition && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">Delete Position</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the position "
                              {
                                positionsData.find(
                                  (p) =>
                                    p.label
                                      .toLowerCase()
                                      .replace(/\s+/g, "") ===
                                    selectedAdminPosition
                                )?.label
                              }
                              " from the database.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeletePosition}
                              disabled={isSubmitting}
                              className="bg-destructive dark:text-destructive-foreground not-dark:text-background"
                            >
                              {isSubmitting && (
                                <Loader2 className="animate-spin" />
                              )}
                              Yea get rid of dat hoe
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Check Positions Section */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    fetchPositionFromDatabase();
                  }}
                  className="cursor-pointer"
                  variant="secondary"
                >
                  Check positions
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[350px] lg:w-[425px]">
                <DialogHeader>
                  <DialogTitle>Positions</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  Select a position that you're interested in.
                </DialogDescription>
                <div className="flex items-center gap-2">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between cursor-pointer"
                        disabled={isLoading}
                      >
                        {isLoading
                          ? "Loading..."
                          : value
                          ? positionsData.find(
                              (position) =>
                                position.label
                                  .toLowerCase()
                                  .replace(/\s+/g, "") === value
                            )?.label
                          : "Select positions..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <div className="rounded-md border">
                        {positionsData.map((position) => {
                          const positionValue = position.label
                            .toLowerCase()
                            .replace(/\s+/g, "");
                          return (
                            <div key={positionValue}>
                              <div
                                className={cn(
                                  "cursor-pointer relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                  value === positionValue
                                    ? "bg-accent text-accent-foreground"
                                    : `transparent ${
                                        position.is_accepting_responses
                                          ? ""
                                          : "text-red-500 opacity-75"
                                      }`
                                )}
                                onClick={() => {
                                  setValue(
                                    positionValue === value ? "" : positionValue
                                  );
                                  setOpen(false);
                                }}
                              >
                                {position.label}
                                {position.is_accepting_responses ? (
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      value === positionValue
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                ) : (
                                  <X className="ml-auto h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <Separator />
                            </div>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Show X icon when selected form is closed */}
                {value && formClosed && (
                  <div className="flex items-center text-red-500">
                    <span className="text-xs">
                      We are not accepting applications for this position
                      currently
                    </span>
                  </div>
                )}
                <DialogFooter>
                  {isLoading && (
                    <div className="flex items-center justify-center">
                      <Loader2
                        size={15}
                        className="animate-spin mr-2 text-slate-500"
                      />
                      <span className="text-xs text-slate-500">
                        Checking form for availability...
                      </span>
                    </div>
                  )}

                  <DialogClose asChild>
                    {value && (
                      <Button
                        variant="secondary"
                        className="border cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            positionsData.find(
                              (p) =>
                                p.label.toLowerCase().replace(/\s+/g, "") ===
                                value
                            )?.form_url || ""
                          );
                          toast.success("Copied link to clipboard!");
                        }}
                      >
                        Copy Link <Clipboard />
                      </Button>
                    )}
                  </DialogClose>
                  <DialogClose asChild>
                    {value && (
                      <Button
                        variant="default"
                        className="cursor-pointer"
                        disabled={!value || isLoading}
                        onClick={() => {
                          const selectedPosition = positionsData.find(
                            (p) =>
                              p.label.toLowerCase().replace(/\s+/g, "") ===
                              value
                          );
                          window.open(selectedPosition?.form_url, "_blank");
                        }}
                      >
                        Goto Form
                      </Button>
                    )}
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Toaster />
      <Footer />
    </div>
  );
}
