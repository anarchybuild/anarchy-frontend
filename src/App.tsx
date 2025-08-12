import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThirdwebProvider } from "thirdweb/react";
import { Suspense, lazy } from "react";
import Layout from "./components/layout/Layout";
import { PageLoader } from "@/components/common/PageLoader";

// Lazy load all page components for better code splitting
const Index = lazy(() => import("./pages/Index"));
const Create = lazy(() => import("./pages/Create"));
const NFTDetail = lazy(() => import("./pages/NFTDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Collection = lazy(() => import("./pages/Collection"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const SetUsername = lazy(() => import("./pages/SetUsername"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const Privacy = lazy(() => import("./pages/Privacy"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const SettingsAndPrivacy = lazy(() => import("./pages/SettingsAndPrivacy"));
const Feeds = lazy(() => import("./pages/Feeds"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThirdwebProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={
                <Suspense fallback={<PageLoader />}>
                  <Index />
                </Suspense>
              } />
              <Route path="/create" element={
                <Suspense fallback={<PageLoader />}>
                  <Create />
                </Suspense>
              } />
              <Route path="/nft/:id" element={
                <Suspense fallback={<PageLoader />}>
                  <NFTDetail />
                </Suspense>
              } />
              <Route path="/profile" element={
                <Suspense fallback={<PageLoader />}>
                  <Profile />
                </Suspense>
              } />
              <Route path="/collection/:collectionId" element={
                <Suspense fallback={<PageLoader />}>
                  <Collection />
                </Suspense>
              } />
              <Route path="/user/:username" element={
                <Suspense fallback={<PageLoader />}>
                  <PublicProfile />
                </Suspense>
              } />
              <Route path="/set-username" element={
                <Suspense fallback={<PageLoader />}>
                  <SetUsername />
                </Suspense>
              } />
              <Route path="/terms" element={
                <Suspense fallback={<PageLoader />}>
                  <TermsOfUse />
                </Suspense>
              } />
              <Route path="/privacy" element={
                <Suspense fallback={<PageLoader />}>
                  <Privacy />
                </Suspense>
              } />
              <Route path="/settings" element={
                <Suspense fallback={<PageLoader />}>
                  <SettingsAndPrivacy />
                </Suspense>
              } />
              <Route path="/feeds" element={
                <Suspense fallback={<PageLoader />}>
                  <Feeds />
                </Suspense>
              } />
              <Route path="/contact" element={
                <Suspense fallback={<PageLoader />}>
                  <ContactUs />
                </Suspense>
              } />
              <Route path="*" element={
                <Suspense fallback={<PageLoader />}>
                  <NotFound />
                </Suspense>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThirdwebProvider>
  </QueryClientProvider>
);

export default App;