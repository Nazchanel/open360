# To Implement
1. Make sure members in same location, icon doesn't overlap
2. Add a Leave Group Button
    - Make sure to update Firebase db to reflect changes
3. Clicking on members in left member menu Zooms to that location
4. Verify that location is updated live using real world tests + members can see each other moving in the app
5. Implement rolling codes (OTP) for joining groups
    - Set time limit for code as well as whether its single use or multiple use
6. Add the ability to add group names
7. Add admin setting and roles allowing admins to change names, remove users, and generate a single-use join code 
    - Display the group roles in the side menu
8. Make sure the icons in the left menu show the same color as the icons on the map. Currently all are displayed as same color.
9. Implement dark mode
    - Allow for manually toggling but set the system theme as the default
10. Ensure complete encryption, following are not currently encrypted and can be visible to Firebase admin
    - Group Code (currently static, with no restrictions)
    - Username (username@open360.com)
10. Implement in React Native to deploy as app
