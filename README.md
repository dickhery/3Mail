
# `3Mail`

Welcome to `3Mail`, a decentralized messaging application built on the Internet Computer (ICP) blockchain. `3Mail` allows users to send and receive messages securely, with messages stored directly on the blockchain. Only the intended recipient can view the messages, ensuring privacy and security.

This README will guide you through setting up, deploying, and using the `3Mail` project both locally and on the ICP mainnet.

## Project Overview

`3Mail` includes a backend canister written in Motoko, handling message storage and retrieval, and a React-based frontend for user interaction. The frontend allows users to submit messages, view received messages, and interact with the decentralized backend. Users can log in using Internet Identity, create custom addresses, and manage their messages with a clean and simple interface.

### Key Features:

- **Decentralized Messaging**: Messages are stored on-chain, ensuring privacy and security.
- **Internet Identity Integration**: Users can log in using their Internet Identity (II) for seamless and secure access.
- **Custom Addresses**: Users can create and manage custom addresses associated with their Internet Identity.
- **Real-Time Notifications**: The app provides instant feedback on message submission and other actions.
- **Message Management**: Users can send, receive, view, and delete messages with ease.

## Project Structure

```plaintext
3Mail/
├── src/
│   ├── threeMail_backend/
│   │   └── main.mo    # The backend canister code (written in Motoko)
│   └── custom_mailbox_frontend/
│       ├── src/
│       │   ├── App.jsx  # The main React component
│       │   ├── index.jsx # Entry point for React
│       │   └── index.scss # Stylesheet
│       └── public/
│           └── index.html  # HTML template
└── dfx.json  # Configuration file for the project
```

## Running the Project Locally

To test and develop `3Mail` locally, follow these steps:

1. **Install necessary dependencies**:
   ```bash
   npm install
   ```

2. **Generate Candid interfaces**:
   ```bash
   dfx generate
   ```

3. **Create canisters**:
   ```bash
   dfx canister create --all
   ```

4. **Start the Internet Computer local replica**:
   ```bash
   dfx start --background
   ```

5. **Deploy the canisters to the local replica**:
   ```bash
   dfx deploy
   ```

   Once deployed, your application will be accessible at `http://localhost:4943?canisterId={asset_canister_id}`.

6. **Start the frontend development server**:
   ```bash
   npm start
   ```

   This will start a server at `http://localhost:8080`, which will proxy API requests to the replica running at port 4943.

### Important Note:
Before deploying the project, replace the canisters in the `canister_ids.json` file with canisters that you control. Failure to do so may result in deployment issues.

## Deploying to the Internet Computer Mainnet

To deploy `3Mail` to the Internet Computer mainnet, ensure you have enough cycles and run:

```bash
dfx deploy --network ic
```

After deployment, you can access your app via the provided URL, such as `https://<canister-id>.ic0.app/`.

## Using 3Mail

### Logging In with Internet Identity

1. **Create an Internet Identity (II)**: If you don’t have one, follow the propts to create one after pressing the Login or Join button which takes everyone to [https://identity.ic0.app](https://identity.ic0.app) then follow the instructions to create an identity.
2. **Log in to `3Mail`**: Click the login button on the app’s homepage. You will be redirected to the Internet Identity authentication page.
3. **Return to the app**: After successful authentication, you’ll be redirected back to `3Mail`, where you’ll see your custom address or Principal ID displayed.

### Creating and Managing Custom Addresses

1. **Create a Custom Address**: After logging in, if you don’t already have a custom address, you can create one by entering it in the provided input field and clicking the "Save Custom Address" button.
2. **Change Custom Address**: If you have a custom address, you can change it by clicking the "Change Custom Address" button, entering a new address, and saving it.
3. **View Your Custom Address**: Your custom address is displayed on the home screen once you log in.

### Sending a Message

1. **Enter the recipient's Principal ID or Custom Address** in the designated input field.
2. **Type a subject** and **compose your message**.
3. Click **Send Message** to submit the message to the backend.
4. A notification will confirm whether the message was sent successfully or if there was an error.

### Viewing and Managing Messages

1. **View Messages**: Click **Get My Messages** to retrieve and view all messages addressed to your Principal ID or custom address.
2. **View Unviewed Messages**: Click **Get Unviewed Messages** to see only the messages you haven’t read yet.
3. **View Sent Messages**: Click **Get Sent Messages** to see the messages you have sent.
4. **Delete Messages**: You can delete individual messages or all messages by using the respective buttons.
5. **Mark Messages as Viewed**: You can mark a message as viewed, which will update its status.

### Real-Time Message Count Display

- The frontend now displays the total number of messages that have been sent through `3Mail`. This count is retrieved from the backend and updated whenever a new message is sent.

### Environment Variables for Frontend

If you are hosting the frontend separately from DFX, ensure the following adjustments are made:

- Set `DFX_NETWORK` to `ic` if using Webpack for production.
- Replace `process.env.DFX_NETWORK` in autogenerated declarations, or use the `env_override` option in `dfx.json`.

## Customization and Further Development

You can customize the frontend by editing the React components in `src/custom_mailbox_frontend/src/`. Styles can be adjusted in the `index.scss` file.

### Future Improvements

- Add pagination or search functionality for messages.
- Implement additional security features.
- Enhance the user interface with more advanced CSS or integrate a UI framework like Bootstrap or Material-UI.

## Troubleshooting

If you encounter any issues, consider the following:

- Verify that DFX is running (`dfx start --background`).
- Ensure the backend canister is correctly deployed and up-to-date (`dfx deploy`).
- Check the browser console for any errors in the frontend.

## Contributing

Contributions are welcome! Feel free to fork this repository, make your changes, and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).