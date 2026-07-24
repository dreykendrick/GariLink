# GariLink GoRouter Navigation Mapping Guide

This guide maps the GoRouter paths, parameters, and redirection logic used in the GariLink Flutter mobile application.

## 1. Route Path Declarations

All paths are configured using flat or nested subroutes inside GoRouter.

| Path | Parent Route | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/welcome` | Root | No | App welcome onboard selection screen |
| `/login` | Root | No | User login portal |
| `/register` | Root | No | User registration page |
| `/home` | Shell | Yes | Home listing feed feed |
| `/explore` | Shell | No | Explore and filter portal |
| `/manage` | Shell | Yes | Owner listing and fleet manager |
| `/saved` | Shell | Yes | Saved listings tab |
| `/trips` | Shell | Yes | Customer rental bookings feed |
| `/profile` | Shell | Yes/No | Profile configuration |

---

## 2. Shell Navigation (Tabs Layout)

The core shell contains a persistent BottomNavigationBar.
*   **Path**: [app_router.dart](file:///C:/Users/kibaj/.gemini/antigravity/scratch/GariLink/mobile_flutter/lib/core/navigation/app_router.dart)
*   **Dynamic Tabs**: If the user is unauthenticated, protected tabs (`/manage`, `/saved`, `/trips`) are dynamically excluded from the navigation bar representation. In this state:
    *   Index 0 -> Home
    *   Index 1 -> Explore
    *   Index 2 -> Profile
*   If the user is authenticated, all 6 tabs are displayed on the navigation bar.

---

## 3. Redirection Flow Guards

The routing engine applies a global `redirect` callback that watches authentication state:

```mermaid
graph TD
    User([User Navigates]) --> Protected{Is Target Route Protected?}
    Protected -- Yes --> AuthCheck{Is Authenticated?}
    AuthCheck -- No --> Welcome[/welcome]
    AuthCheck -- Yes --> TargetRoute([Target Route])
    Protected -- No --> Onboarding{Is Welcome/Login/Register Route?}
    Onboarding -- Yes --> AuthCheck2{Is Authenticated?}
    AuthCheck2 -- Yes --> Home[/home]
    AuthCheck2 -- No --> TargetRoute
    Onboarding -- No --> TargetRoute
```
