import IconLinkWide from "@/components/subcomponents/IconLinkWide";
import { Check, ListPlus, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { toast, Toaster } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import iconMap from "@/utils/iconMap";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Define the schema for our form
const formSchema = z.object({
  label: z.string().min(1, "Label is required"),
  link: z.string().url("Please enter a valid URL"),
  iconType: z.string().min(1, "Icon type is required"),
  isOpen: z.boolean().default(true),
});

// Define the type for our links
interface Link {
  id?: number; // Supabase will provide this
  iconType: string;
  label: string;
  link: string;
  isOpen: boolean;
  date: string;
}
// Define fallback links to display when no links are available
const fallbackLinks: Link[] = [
  {
    iconType: "rubric",
    label: "Merch",
    link: "https://campus.hellorubric.com/?s=7805",
    isOpen: true,
    date: "2024-10-31",
  },
  {
    iconType: "rubric",
    label: "Membership & Ticket Sales",
    link: "https://campus.hellorubric.com/?s=7805",
    isOpen: true,
    date: "2024-10-31",
  },
  {
    iconType: "googleForms",
    label: "Google Forms",
    link: "https://forms.gle/yVZcBeKBWPCm235aA",
    isOpen: true,
    date: "2024-10-31",
  },

  {
    iconType: "discord",
    label: "Discord Server",
    link: "https://discord.com/invite/tbKkvjV2W8",
    isOpen: true,
    date: "2024-10-31",
  },
];

export default function QuickLinks() {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteMode, setDeleteMode] = useState(false);
  const { user } = useAuth();

  // Fetch links from Supabase on component mount
  useEffect(() => {
    fetchLinks();
  }, []);

  // Function to fetch links from Supabase
  async function fetchLinks() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.error("Fetch error details:", error);
        throw error;
      }

      if (data && data.length > 0) {
        // Only use database data if there are records
        setLinks(data);
      } else {
        // No links returned or empty array, use fallback links
        setLinks(fallbackLinks);
      }
    } catch (error) {
      toast.error("Failed to load links from database");
      console.error("Error loading links: ", error);
      setLinks(fallbackLinks);
    } finally {
      setLoading(false);
    }
  }

  // Function to delete a link
  async function deleteLink(id: number, label: string) {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to delete links");
        return;
      }

      const { error } = await supabase.from("links").delete().eq("id", id);

      if (error) {
        throw error;
      }

      const updatedLinks = links.filter((link) => link.id !== id);

      // If we deleted the last database link, show fallback links
      if (updatedLinks.length === 0) {
        setLinks(fallbackLinks);
      } else {
        setLinks(updatedLinks);
      }

      toast.success(`Deleted link: ${label}`);
    } catch (error) {
      toast.error("Failed to delete link");
      console.error("Error deleting link: ", error);
    }
  }

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: "",
      link: "",
      iconType: "link",
      isOpen: true,
    },
  });
  // Function to add a new link
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to add links");
        return;
      }

      // Format the current date as YYYY-MM-DD
      const currentDate = new Date().toISOString().split("T")[0];

      // Create the new link object
      const newLink = {
        ...values,
        date: currentDate,
        user_id: user.id, // Add user ID to link data
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from("links")
        .insert([newLink])
        .select();

      if (error) {
        throw error;
      }

      if (data) {
        setLinks([data[0], ...links]);
        toast.success(`Added new link: ${values.label}`);
        setOpen(false);
        form.reset();
      }
    } catch (error) {
      toast.error("Failed to add link");
      console.error("Error adding link: ", error);
    }
  }

  return (
    <div
      className={`flex flex-col space-y-4 w-full px-4 lg:mx-4 
                  mt-5 md:max-w-1/2 justify-center m-auto md:mt-10`}
    >
      {user && (
        <div className="flex justify-center space-x-2 mb-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <ListPlus />
                Add Links
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Link</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter link title" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is the name that will be displayed for the link.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the full URL including https://
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="iconType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row flex-wrap justify-start md:justify-around"
                          >
                            {Object.keys(iconMap).map((iconKey) => {
                              const Icon = iconMap[iconKey].iconComponent;
                              const imagePath = iconMap[iconKey].imagePath;
                              return (
                                <FormItem
                                  key={iconKey}
                                  className="flex flex-col items-center space-y-2"
                                >
                                  <FormControl>
                                    <RadioGroupItem
                                      value={iconKey}
                                      id={iconKey}
                                      className="sr-only"
                                    />
                                  </FormControl>
                                  <label
                                    htmlFor={iconKey}
                                    className={`flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${
                                      field.value === iconKey
                                        ? "border-primary bg-accent"
                                        : "border-muted"
                                    }`}
                                  >
                                    {Icon && <Icon strokeWidth={2} size={30} />}
                                    {imagePath && (
                                      <img
                                        src={imagePath}
                                        alt={iconKey}
                                        className="w-8 h-8 object-contain"
                                      />
                                    )}
                                  </label>
                                </FormItem>
                              );
                            })}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isOpen"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Available</FormLabel>
                          <FormDescription>
                            Is this link currently available?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Add Link
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button
            variant={deleteMode ? "default" : "outline"}
            className="w-fit"
            onClick={() => setDeleteMode(!deleteMode)}
          >
            {deleteMode ? <Check /> : <Trash2 />}
            {deleteMode ? "Done" : "Delete Links"}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin rounded-full h-12 w-12 text-gray-700" />
        </div>
      ) : (
        links.map((link) => (
          <IconLinkWide
            key={link.id || link.label}
            iconType={link.iconType}
            label={link.label}
            link={link.link}
            isOpen={link.isOpen}
            date={link.date}
            className="bg-secondary border-2 
            border-ring text-center drop-shadow-box
            hover:bg-muted"
            deleteMode={deleteMode}
            onDelete={
              link.id !== undefined
                ? () => deleteLink(link.id as number, link.label)
                : undefined
            }
          />
        ))
      )}

      <Toaster />
    </div>
  );
}
