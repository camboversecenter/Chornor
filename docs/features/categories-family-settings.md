# Categories, Family, and Settings

This tab groups three related management screens behind one entry in the
navigation. In the app it is labeled Settings (ការកំណត់), and it uses an inner
tab strip to switch between Categories, Family, and general Settings.

- **Route:** `/settings`
- **Components:** `src/components/CategoryManager.tsx`,
  `src/components/FamilyManager.tsx`, plus inline settings in `src/App.tsx`.
- **Available to:** all signed in users, including guests.

## Categories

Categories classify transactions and decide whether an entry is income or
expense. The `Category` type in `src/types.ts` has:

| Field | Meaning |
| --- | --- |
| `_id` | Unique id |
| `name` | Display name (often Khmer) |
| `chomnay` | Income or expense flag |
| `color` | Color used in charts and lists |
| `order` | Sort order |
| `user_id` | Owner, for cloud users |

`CategoryManager` lets a user add a category (name, color, income or expense)
and delete one. Deletion is confirmed before applying. New users are seeded with
a default set of categories from `src/constants.ts`.

Categories are important beyond bookkeeping. The AI receipt scanner and category
suggestion both receive the current category list so they can map a scanned or
described transaction to one of the user's own categories.

## Family

Family members let a user attribute transactions, savings, and loans to specific
people in a household. The `Family` type is simple: an `_id` and a `name`.

`FamilyManager` lets a user add and remove family members. A transaction can
carry an optional `familyId`, and savings goals can be tied to a family member
as well.

## General settings

The Settings inner tab, rendered directly in `App.tsx`, contains:

- **Default currency.** A toggle between Khmer Riel and US Dollar. This sets the
  preferred currency used across the app for display and conversion.
- **How to guide.** Opens an in app usage guide.
- **Account panel.** Shows the signed in user's name, email, avatar, and a role
  badge (Guest or Admin), with a logout button.
- **Simulate external request.** Only shown to test users. It injects a mock
  pending transaction request so the approval flow can be tried without a real
  API call.
- **Footer.** App version (0.02 Beta), a community license link, and a credits
  link.

## Storage

Category and family changes go through the storage service
(`saveCategory`, `deleteCategory`, `saveFamilyMembers`, `deleteFamilyMember`)
and follow the same local versus cloud rule as the rest of the app. The
preferred currency is stored with `savePreferredCurrency`.
