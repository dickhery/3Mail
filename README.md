# `3Mail`

Welcome to **`3Mail`**, a decentralized messaging application built on the Internet Computer (ICP) blockchain. `3Mail` allows users to send and receive messages securely, with messages stored directly on the blockchain. Only the intended recipient can view the messages, ensuring privacy and security.

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
│   │   └── main.mo                # The backend canister code (written in Motoko)
│   └── custom_mailbox_frontend/
│       ├── src/
│       │   ├── App.jsx            # The main React component
│       │   ├── index.jsx          # Entry point for React
│       │   └── index.scss         # Stylesheet
│       └── public/
│           └── index.html         # HTML template
├── dfx.json                       # Configuration file for the project
└── canister_ids.json              # Canister IDs for different networks
```

## Prerequisites

- **Node.js** (version 12 or higher): [Download Node.js](https://nodejs.org/en/download/)
- **DFX SDK** (The DFINITY Canister SDK, version 0.8.0 or higher): [Install DFX SDK](https://smartcontracts.org/docs/developers-guide/install-upgrade-remove.html)

## Running the Project Locally

To test and develop `3Mail` locally, follow these steps:

1. **Clone the Repository and Navigate to the Project Root Directory**:

   ```bash
   git clone https://github.com/yourusername/3Mail.git
   cd 3Mail
   ```

2. **Install Necessary Dependencies**:

   ```bash
   npm install
   ```

3. **Start the Internet Computer Local Replica**:

   ```bash
   dfx start --background --clean
   ```

   - The `--clean` flag ensures a fresh start by erasing any existing state.
   - The `--background` flag runs the replica in the background.

4. **Create Canisters**:

   ```bash
   dfx canister create --all
   ```

   This command creates all the canisters specified in your `dfx.json` configuration.

5. **Deploy the Canisters to the Local Replica**:

   ```bash
   dfx deploy
   ```

   This will build and deploy your canisters to the local Internet Computer replica. Once deployed, your application will be accessible locally.

6. **Start the Frontend Development Server**:

   ```bash
   npm start
   ```

   This will start the React development server at `http://localhost:8080`. The frontend is configured to proxy API requests to the local replica running at port 4943.

### Important Notes:

- **Ensure You Are in the Project's Root Directory**: All commands should be run from the root directory of the project.
- **Stopping the Replica**: When you're done, you can stop the local replica by running:

  ```bash
  dfx stop
  ```

- **Dependency Issues**: If you encounter any dependency issues, make sure that your `dfx` version is compatible with the project's requirements.

## Deploying to the Internet Computer Mainnet

To deploy `3Mail` to the Internet Computer mainnet, follow these steps:

1. **Replace Canister IDs**:

   Before deploying to the mainnet, you need to replace the canister IDs in the `canister_ids.json` file with canister IDs that you control.

   - Open `canister_ids.json` and locate the entries under the `"ic"` network.
   - Replace the canister IDs with your own. If you don't have canister IDs on the mainnet yet, the `dfx deploy` command will create them for you.
   - Ensure that your principal (identity) has the necessary permissions to create and manage canisters on the mainnet.

2. **Ensure You Have Enough Cycles**:

   Deploying to the mainnet requires cycles (the fuel for canisters). Make sure your account has enough cycles to create and run the canisters.

3. **Deploy to the Mainnet**:

   ```bash
   dfx deploy --network ic
   ```

   This command builds and deploys your canisters to the Internet Computer mainnet.

4. **Access Your Application**:

   After deployment, you can access your app via the provided URL, such as `https://<canister-id>.ic0.app/`.

### Additional Information:

- **Updating Canister IDs**: If `dfx deploy` creates new canisters for you, it will update the `canister_ids.json` file automatically.
- **Internet Identity Configuration**: When deploying to the mainnet, ensure that your Internet Identity configurations are correct and that users can authenticate using `https://identity.ic0.app`.

## Using 3Mail

### Logging In with Internet Identity

1. **Create an Internet Identity (II)**:

   If you don’t have one, you can create one by visiting [https://identity.ic0.app](https://identity.ic0.app) and following the instructions.

2. **Log In to `3Mail`**:

   - Click the **Login** button on the app’s homepage.
   - You will be redirected to the Internet Identity authentication page.

3. **Return to the App**:

   After successful authentication, you’ll be redirected back to `3Mail`, where you’ll see your custom address or Principal ID displayed.

### Creating and Managing Custom Addresses

1. **Create a Custom Address**:

   - After logging in, if you don’t already have a custom address, you can create one by entering it in the provided input field.
   - Click the **Save Custom Address** button to save it.

2. **Change Custom Address**:

   - If you have a custom address, you can change it by clicking the **Change Custom Address** button.
   - Enter a new address and click **Save Custom Address**.

3. **View Your Custom Address**:

   Your custom address is displayed on the home screen once you log in.

### Sending a Message

1. **Enter the Recipient's Principal ID or Custom Address**:

   In the designated input field, enter the recipient's Principal ID or their custom `3Mail` address.

2. **Type a Subject and Compose Your Message**:

   - Fill in the **Subject** line.
   - Write your message in the **Message** body field.

3. **Send the Message**:

   Click **Send Message** to submit the message to the backend.

4. **Confirmation**:

   A notification will confirm whether the message was sent successfully or if there was an error.

### Viewing and Managing Messages

1. **View Messages**:

   - Click **Get My Messages** to retrieve and view all messages addressed to your Principal ID or custom address.
   - Click **Get Unviewed Messages** to see only the messages you haven’t read yet.
   - Click **Get Sent Messages** to see the messages you have sent.

2. **Delete Messages**:

   - You can delete individual messages by clicking the **Delete** button next to each message.
   - To delete all messages, click the **Delete All Messages** button.

3. **Mark Messages as Viewed**:

   You can mark a message as viewed by clicking the **Mark as Viewed** button next to each message.

### Searching Messages

- **Search by Subject**:

  Use the search functionality to find messages by their subject line.

### Real-Time Message Count Display

- The frontend displays the total number of messages that have been sent through `3Mail`. This count is retrieved from the backend and updated whenever a new message is sent.

## Customization and Further Development

You can customize the frontend by editing the React components in `src/custom_mailbox_frontend/src/`. Styles can be adjusted in the `index.scss` file.

### Environment Variables for Frontend

If you are hosting the frontend separately from DFX, ensure the following adjustments are made:

- **Set `DFX_NETWORK`**:

  Set `DFX_NETWORK` to `ic` if using Webpack for production.

- **Adjust Autogenerated Declarations**:

  Replace `process.env.DFX_NETWORK` in autogenerated declarations, or use the `env_override` option in `dfx.json`.

### Future Improvements

- **Pagination**:

  Add pagination to handle large numbers of messages.

- **Enhanced Security**:

  Implement additional security features to further protect user data.

- **UI Enhancements**:

  Improve the user interface with advanced CSS or integrate a UI framework like Bootstrap or Material-UI.

## Troubleshooting

If you encounter any issues, consider the following:

- **DFX Not Running**:

  Verify that DFX is running by executing `dfx start --background`.

- **Deployment Issues**:

  Ensure the backend canister is correctly deployed and up-to-date by running `dfx deploy`.

- **Canister IDs**:

  Check that the `canister_ids.json` file contains the correct canister IDs, especially when deploying to the mainnet.

- **Browser Console**:

  Check the browser console for any errors in the frontend.

- **Dependencies**:

  Ensure all NPM dependencies are installed by running `npm install`.

## Contributing

Contributions are welcome! Feel free to fork this repository, make your changes, and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
