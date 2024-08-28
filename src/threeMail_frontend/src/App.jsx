import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory as threeMail_backend_idl, canisterId as threeMail_backend_id } from 'declarations/threeMail_backend';
import logo from '../public/images/3mail-logo.png';
import loginButton from '../public/images/login-button.png';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [principal, setPrincipal] = useState('');
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [response, setResponse] = useState('');
  const [threeMailActor, setThreeMailActor] = useState(null);
  const [totalMessagesSent, setTotalMessagesSent] = useState(null);
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [hasCustomAddress, setHasCustomAddress] = useState(false);
  const [showCreateUsername, setShowCreateUsername] = useState(false);
  const [searchSubject, setSearchSubject] = useState('');

  useEffect(() => {
    async function initAuth() {
      const client = await AuthClient.create();
      setAuthClient(client);

      if (await client.isAuthenticated()) {
        const identity = client.getIdentity();
        setPrincipal(identity.getPrincipal().toText());
        setIsAuthenticated(true);

        const agent = new HttpAgent({ identity });
        const actor = Actor.createActor(threeMail_backend_idl, {
          agent,
          canisterId: threeMail_backend_id,
        });
        setThreeMailActor(actor);

        try {
          const totalSent = await actor.getTotalMessagesSent();
          setTotalMessagesSent(totalSent.toString());

          const storedUsername = await actor.getCustomAddress(Principal.fromText(identity.getPrincipal().toText()));
          if (storedUsername && storedUsername.customAddress) {
            setUsername(storedUsername.customAddress);
            setHasCustomAddress(true);
          } else {
            setUsername(identity.getPrincipal().toText());
            setShowCreateUsername(true);
          }
        } catch (error) {
          console.error('Error initializing user data:', error);
          setTotalMessagesSent("0");
        }
      }
    }
    initAuth();
  }, []);

  const handleLogin = async () => {
    if (authClient) {
      resetTextFields();
      await authClient.login({
        identityProvider: "https://identity.ic0.app",
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          setPrincipal(identity.getPrincipal().toText());
          setIsAuthenticated(true);

          const agent = new HttpAgent({ identity });
          const actor = Actor.createActor(threeMail_backend_idl, {
            agent,
            canisterId: threeMail_backend_id,
          });
          setThreeMailActor(actor);

          try {
            const totalSent = await actor.getTotalMessagesSent();
            setTotalMessagesSent(totalSent.toString());

            const storedUsername = await actor.getCustomAddress(Principal.fromText(identity.getPrincipal().toText()));
            if (storedUsername && storedUsername.customAddress) {
              setUsername(storedUsername.customAddress);
              setHasCustomAddress(true);
            } else {
              setUsername(identity.getPrincipal().toText());
              setShowCreateUsername(true);
            }
          } catch (error) {
            console.error('Error fetching user data after login:', error);
            setTotalMessagesSent("0");
          }
        }
      });
    }
  };

  const handleLogout = async () => {
    if (authClient) {
      await authClient.logout();
      resetTextFields();
      setIsAuthenticated(false);
      setPrincipal('');
      setMessages([]);
      setThreeMailActor(null);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    try {
      if (threeMailActor) {
        const resolvedRecipient = await resolveRecipient(recipient);
        if (resolvedRecipient) {
          const result = await threeMailActor.submitMessage(resolvedRecipient, subject, messageBody);
          setResponse(result);
          resetTextFields();

          const totalSent = await threeMailActor.getTotalMessagesSent();
          setTotalMessagesSent(totalSent.toString());
        } else {
          setResponse("Recipient is not a valid Principal ID or custom address.");
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setResponse("Failed to send message. Check the console for more details.");
    }
  };

  const resolveRecipient = async (input) => {
    try {
      const principal = Principal.fromText(input);
      console.log("Recipient is a valid Principal ID:", principal.toText());
      return principal;
    } catch (e) {
      console.log("Input is not a valid Principal ID, attempting to resolve as a custom address.");

      try {
        const customAddressPrincipalOpt = await threeMailActor.resolveCustomAddress(input.toLowerCase());
        if (customAddressPrincipalOpt && customAddressPrincipalOpt.length > 0) {
          const customAddressPrincipal = customAddressPrincipalOpt[0];
          console.log("Custom address resolved to Principal ID:", customAddressPrincipal.toText());
          return Principal.fromText(customAddressPrincipal.toText());
        } else {
          console.error("Resolved custom address is not a valid Principal.");
          return null;
        }
      } catch (error) {
        console.error("Failed to resolve custom address:", error);
        return null;
      }
    }
  };

  const handleCreateUsername = async () => {
    if (newUsername.trim() !== '') {
      try {
        const success = await threeMailActor.setUsername(newUsername, Principal.fromText(principal));
        if (success) {
          setUsername(newUsername);
          setHasCustomAddress(true);
          setShowCreateUsername(false);
        } else {
          alert('Username already exists. Please choose another one.');
        }
      } catch (error) {
        console.error('Failed to create username:', error);
      }
    }
  };

  const handleGetMessages = async () => {
    try {
      if (threeMailActor) {
        let userMessages = await threeMailActor.getMyMessages();
        setMessages(userMessages);
      }
    } catch (error) {
      console.error("Error retrieving messages:", error);
    }
  };

  const handleGetUnviewedMessages = async () => {
    try {
      if (threeMailActor) {
        let userMessages = await threeMailActor.getUnviewedMessages();
        setMessages(userMessages);
      }
    } catch (error) {
      console.error("Error retrieving unviewed messages:", error);
    }
  };

  const handleGetSentMessages = async () => {
    try {
      if (threeMailActor) {
        let sentMessages = await threeMailActor.getSentMessages();
        setMessages(sentMessages);
      }
    } catch (error) {
      console.error("Error retrieving sent messages:", error);
    }
  };

  const handleDeleteMessage = async (subject) => {
    try {
      if (threeMailActor) {
        const result = await threeMailActor.deleteMessage(subject);
        setResponse(result);
        handleGetMessages();
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleMarkAsViewed = async (subject) => {
    try {
      if (threeMailActor) {
        const result = await threeMailActor.markAsViewed(subject);
        setResponse(result);
        handleGetMessages();
      }
    } catch (error) {
      console.error("Error marking message as viewed:", error);
    }
  };

  const handleGetTotalMessages = async () => {
    try {
      if (threeMailActor) {
        const total = await threeMailActor.getTotalMessages();
        setResponse(`Total messages received: ${total}`);
      }
    } catch (error) {
      console.error("Error retrieving total messages:", error);
    }
  };

  const handleDeleteAllMessages = async () => {
    if (window.confirm("Are you sure you want to delete all your messages? This action cannot be undone.")) {
      try {
        if (threeMailActor) {
          const result = await threeMailActor.deleteAllMessages();
          setResponse(result);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error deleting all messages:", error);
      }
    }
  };

  const handleSearchBySubject = async (event) => {
    event.preventDefault();
    try {
      if (threeMailActor) {
        let searchResults = await threeMailActor.searchBySubject(searchSubject);
        setMessages(searchResults);
      }
    } catch (error) {
      console.error("Error searching messages by subject:", error);
    }
  };

  const handleCopyPrincipal = () => {
    try {
      navigator.clipboard.writeText(hasCustomAddress ? username : principal).then(() => {
        setResponse("Address copied to clipboard.");
        setTimeout(() => setResponse(""), 2000);
      });
    } catch (error) {
      console.error("Clipboard API error:", error);
      setResponse("Failed to copy address. Check clipboard permissions.");
    }
  };

  const resetTextFields = () => {
    setRecipient('');
    setSubject('');
    setMessageBody('');
    setNewUsername('');
    setSearchSubject('');
  };

  const backgroundStyle = {
    backgroundImage: `url('/images/login-background.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  };

  const mainBackgroundStyle = {
    backgroundImage: `url('/images/main-background.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: '100vh',
  };

  return (
    <main style={isAuthenticated ? mainBackgroundStyle : backgroundStyle}>
      <div style={{ textAlign: 'center' }}>
        <img src={logo} alt="3Mail Logo" style={{ width: '220px', marginBottom: '10px', marginTop: '10px' }} />
        {!isAuthenticated && (
          <>
            <img
              src={loginButton}
              alt="Login Button"
              onClick={handleLogin}
              style={{ width: '150px', cursor: 'pointer', marginTop: '10px' }}
            />
            <p style={{ fontSize: '12px', marginTop: '20px', color: '#888' }}>
              Created by <a href="https://richardhery.com" target="_blank" rel="noopener noreferrer" style={{ color: '#888' }}>RichardHery.com</a>
            </p>
          </>
        )}
      </div>
      {isAuthenticated && (
        <div>
          <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer', marginBottom: '20px' }}>
            Logout
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', marginBottom: '10px', flexDirection: 'column' }}>
            <p><strong>Your 3Mail Address:</strong></p>
            <p>{hasCustomAddress ? username : principal}</p>
            <button onClick={handleCopyPrincipal} style={{ marginTop: '10px', padding: '5px', fontSize: '12px', cursor: 'pointer' }}>
              Copy Address
            </button>
            {hasCustomAddress ? (
              <button onClick={() => setShowCreateUsername(true)} style={{ marginTop: '10px', padding: '5px', fontSize: '12px', cursor: 'pointer' }}>
                Change Custom Address
              </button>
            ) : (
              <button onClick={() => setShowCreateUsername(true)} style={{ marginTop: '10px', padding: '5px', fontSize: '12px', cursor: 'pointer' }}>
                Create Custom Address
              </button>
            )}
          </div>

          {showCreateUsername && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Enter Custom Address"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                style={{ padding: '10px', width: '80%', textAlign: 'center', marginBottom: '10px' }}
              />
              <button onClick={handleCreateUsername} style={{ padding: '10px 20px', cursor: 'pointer' }}>Save Custom Address</button>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <h2>Send a Message</h2>
            <form onSubmit={handleSendMessage} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
                <label>Recipient PID or Custom Address:</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  style={{ padding: '5px', width: '300px', textAlign: 'center' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
                <label>Subject:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ padding: '5px', width: '300px', textAlign: 'center' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
                <label>Message:</label>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  style={{ padding: '5px', width: '300px', height: '100px', textAlign: 'center' }}
                />
              </div>
              <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', alignSelf: 'center' }}>Send Message</button>
            </form>
            {response && <p>{response}</p>}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
            <button onClick={handleGetMessages} style={{ padding: '10px 20px', cursor: 'pointer' }}>
              Get My Messages
            </button>
            <button onClick={handleGetUnviewedMessages} style={{ padding: '10px 20px', cursor: 'pointer' }}>
              Get Unviewed Messages
            </button>
            <button onClick={handleGetSentMessages} style={{ padding: '10px 20px', cursor: 'pointer' }}>
              Get Sent Messages
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
            <button onClick={handleGetTotalMessages} style={{ padding: '10px 20px', cursor: 'pointer' }}>
              Check Total Messages
            </button>
            <button onClick={handleDeleteAllMessages} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: 'red', color: 'white' }}>
              Delete All Messages
            </button>
          </div>

          <form onSubmit={handleSearchBySubject} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
              <label>Search Messages by Subject:</label>
              <input
                type="text"
                value={searchSubject}
                onChange={(e) => setSearchSubject(e.target.value)}
                style={{ padding: '5px', width: '300px', textAlign: 'center' }}
              />
              <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '10px', alignSelf: 'center' }}>Search</button>
            </div>
          </form>

          {messages.length > 0 && (
            <div style={{ maxHeight: '300px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px', marginTop: '20px' }}>
              {messages.map((msg, index) => (
                <div key={index} style={{ marginBottom: '10px', padding: '10px', borderBottom: '1px solid #ccc' }}>
                  <strong>Subject:</strong> {msg.subject}<br />
                  <strong>Message:</strong> {msg.message}<br />
                  <strong>Timestamp:</strong> {new Date(Number(msg.timestamp / 1000000n)).toLocaleString()}<br />
                  <strong>From:</strong> {msg.senderCustomAddress || msg.sender.toText()}<br />
                  {msg.recipient ? (
                    <>
                      <strong>To:</strong> {msg.recipient.toText()}<br />
                    </>
                  ) : null}

                  <button onClick={() => handleMarkAsViewed(msg.subject)} style={{ marginLeft: '10px', cursor: 'pointer' }}>Mark as Viewed</button>
                  <button onClick={() => handleDeleteMessage(msg.subject)} style={{ marginLeft: '10px', cursor: 'pointer' }}>Delete</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '10px', textAlign: 'center' }}>
            <h2>About 3Mail</h2>
            <p>
              3Mail is a decentralized messaging app hosted on the Internet Computer blockchain. This ensures that your messages are secure,
              immutable, and private.
            </p>
            <p>
              To date, <strong>{totalMessagesSent !== null ? totalMessagesSent : '...'}</strong> messages have been sent through 3Mail.
            </p>
            <p>
              Created by <a href="https://richardhery.com" target="_blank" rel="noopener noreferrer">RichardHery.com</a>
            </p>
          </div>

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <h3>Brought to you by</h3>
            <a href="https://3jorm-yqaaa-aaaam-aaa6a-cai.ic0.app/index-gaming.html" target="_blank" rel="noopener noreferrer">
              <img src="/images/advertisement.png" alt="Advertisement" style={{ maxWidth: '120%', height: 'auto' }} />
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
