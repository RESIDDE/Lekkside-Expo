import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import {
  ArrowRight,
  User,
  Mail,
  Building2,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import lekksideLogo from "@/assets/lekkside-logo.png";
import { motion } from "framer-motion";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

export default function ExhibitorSignup() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [boothInfo, setBoothInfo] = useState<{
    booth_name: string;
    booth_number: string;
  } | null>(null);

  const [isLoginMode, setIsLoginMode] = useState(!token);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      // If no token, we are in login mode (just accessing the page directly)
      // We don't need to validate token or show error
      setIsValidating(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase
        .from("exhibition_booths")
        .select("booth_name, booth_number, is_active")
        .eq("invitation_token", token)
        .single();

      if (error || !data) {
        toast({
          title: "Invalid Token",
          description: "This invitation link is invalid or has expired.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      if (!data.is_active) {
        toast({
          title: "Booth Inactive",
          description: "This booth is currently inactive.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setBoothInfo({
        booth_name: data.booth_name,
        booth_number: data.booth_number,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate invitation link.",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setIsValidating(false);
    }
  };

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);

      if (!isLoginMode) {
        if (!firstName.trim()) {
          toast({
            title: "Validation Error",
            description: "First name is required.",
            variant: "destructive",
          });
          return false;
        }

        if (!lastName.trim()) {
          toast({
            title: "Validation Error",
            description: "Last name is required.",
            variant: "destructive",
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // If we have a token, we need to validate inputs (especially for signup)
    // If no token, we just need email/password for login
    if (!validateInputs()) return;

    setIsLoading(true);

    try {
      let userId;

      if (isLoginMode) {
        // Sign In Flow
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to sign in");
        userId = authData.user.id;
      } else {
        // Sign Up Flow - ONLY allowed with token
        if (!token) {
          toast({
            title: "Invitation Required",
            description:
              "You need an invitation link to create a new exhibitor account.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,
            password,
            options: {
              data: {
                first_name: firstName,
                last_name: lastName,
                company_name: companyName,
                user_type: "exhibitor",
              },
            },
          },
        );

        if (authError) {
          // If user already exists, suggest logging in
          if (authError.message.includes("User already registered")) {
            toast({
              title: "Account Exists",
              description:
                "This email is already registered. Please sign in instead.",
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLoginMode(true)}
                >
                  Sign In
                </Button>
              ),
            });
            setIsLoading(false);
            return;
          }
          throw authError;
        }

        if (!authData.user) {
          throw new Error("Failed to create user account");
        }
        userId = authData.user.id;
      }

      // If we have a token, link to that specific booth
      if (token) {
        const { data: boothData } = await supabase
          .from("exhibition_booths")
          .select("id")
          .eq("invitation_token", token)
          .single();

        if (!boothData) {
          throw new Error("Booth not found");
        }

        // Check if already an exhibitor for this booth
        const { data: existingExhibitor } = await supabase
          .from("exhibitors")
          .select("id")
          .eq("booth_id", boothData.id)
          .eq("user_id", userId)
          .single();

        if (!existingExhibitor) {
          const { error: exhibitorError } = await supabase
            .from("exhibitors")
            .insert({
              booth_id: boothData.id,
              user_id: userId,
              email,
              first_name: isLoginMode ? undefined : firstName,
              last_name: isLoginMode ? undefined : lastName,
              company_name: isLoginMode ? undefined : companyName,
            });

          if (exhibitorError) throw exhibitorError;
        }

        toast({
          title: isLoginMode ? "Welcome Back" : "Account Created",
          description: "Redirecting to your dashboard...",
        });

        setTimeout(() => {
          navigate(`/exhibitor/dashboard/${boothData.id}`);
        }, 2000);
      } else {
        // No token - Login Flow - Find their booth
        const { data: exhibitorData, error: exhibitorError } = await supabase
          .from("exhibitors")
          .select("booth_id")
          .eq("user_id", userId)
          .single();

        if (exhibitorError || !exhibitorData) {
          toast({
            title: "No Booth Found",
            description:
              "We couldn't find a booth associated with this account.",
            variant: "destructive",
          });
          // Maybe sign them out or let them contact support?
          await supabase.auth.signOut();
        } else {
          toast({
            title: "Welcome Back",
            description: "Redirecting to your dashboard...",
          });
          setTimeout(() => {
            navigate(`/exhibitor/dashboard/${exhibitorData.booth_id}`);
          }, 1000);
        }
      }
    } catch (error: any) {
      toast({
        title: isLoginMode ? "Login Failed" : "Registration Failed",
        description: error.message || "Failed to process request.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">
            Validating invitation...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative inline-block"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-4 shadow-2xl shadow-primary/30 mx-auto">
              <img
                src={lekksideLogo}
                alt="Lekkside"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg border-2 border-white">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-heading font-semibold text-foreground tracking-tight">
            Exhibitor Registration
          </h1>
          {boothInfo && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Building2 className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-primary">
                {boothInfo.booth_name} - Booth {boothInfo.booth_number}
              </p>
            </div>
          )}
        </div>

        <Card className="border-none shadow-premium bg-white/90 backdrop-blur-2xl rounded-[3rem] overflow-hidden">
          <CardHeader className="pb-4 px-8 pt-8">
            <CardDescription className="text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              {isLoginMode
                ? "Sign in to claim your booth"
                : "Create your exhibitor account"}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSignUp} className="space-y-5">
              {!isLoginMode && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-[10px] font-semibold uppercase tracking-widest text-primary px-1"
                    >
                      First Name
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-semibold"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-[10px] font-semibold uppercase tracking-widest text-primary px-1"
                    >
                      Last Name
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-semibold"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[10px] font-semibold uppercase tracking-widest text-primary px-1"
                >
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@company.com"
                    className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-semibold"
                    required
                  />
                </div>
              </div>

              {!isLoginMode && (
                <div className="space-y-2">
                  <Label
                    htmlFor="company"
                    className="text-[10px] font-semibold uppercase tracking-widest text-primary px-1"
                  >
                    Company Name (Optional)
                  </Label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="company"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Corp"
                      className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-semibold"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-semibold uppercase tracking-widest text-primary px-1"
                >
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-primary/20 font-semibold"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl font-semibold text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>
                      {isLoginMode ? "Sign In & Claim Booth" : "Create Account"}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="text-sm text-muted-foreground hover:text-primary font-semibold transition-colors"
              >
                {isLoginMode
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-[10px] text-center text-muted-foreground font-semibold uppercase tracking-[0.4em]"
        >
          Lekkside Exhibitor Portal
        </motion.p>
      </motion.div>
    </div>
  );
}
