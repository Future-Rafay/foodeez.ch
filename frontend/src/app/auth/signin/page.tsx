"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/core/Input";
import { Button } from "@/components/core/Button";
import { FcGoogle } from "react-icons/fc";
import Image from "next/image";
import SEO from "@/components/seo/SEO";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (error) {
      setErrorMessage("Invalid email or password. Please try again.");
    }
  }, [error]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setErrorMessage(result.error.startsWith("Too many") ? result.error : "Invalid email or password");
        return;
      }

      if (result?.url) {
        router.push(result.url);
      } else {
        router.push(callbackUrl);
      }
      router.refresh();
    } catch (err) {
      setErrorMessage("An error occurred. Please try again.");
      console.error("Log in error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", { callbackUrl });
    } catch (err) {
      setErrorMessage("Failed to Log in with Google");
      console.error("Google Log in error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <Link href="/" className="inline-block mb-8">
            <Image
              src="/Logo/LogoFoodeezMain.svg"
              alt="Foodeez Logo"
              width={120}
              height={120}
              className="mx-auto"
            />
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-primary hover:text-primary-dark transition-colors"
            >
              create a new account
            </Link>
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            className="py-2.5"
          >
            Log in
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={handleGoogleSignIn}
            className="py-2.5"
          >
            <FcGoogle className="w-5 h-5 mr-2" />
            Log in with Google
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <>
      <SEO
        title="Log in"
        description="Log in to your Foodeez account."
        url="https://foodeez.ch/auth/signin"
        canonical="https://foodeez.ch/auth/signin"
        noindex
        nofollow
        type="website"
      />
      <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
    </>
  );
}
