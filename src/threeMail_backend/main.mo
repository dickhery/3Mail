import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";

actor class Mailbox() = this {
  // Structure to hold each message
  type Message = {
    sender: Principal;
    recipient: Principal;
    subject: Text;
    message: Text;
    timestamp: Time.Time;
    viewed: Bool;
  };

  // Storage for messages
  stable var messages: [Message] = [];

  // List of allowed principal IDs
  let allowedPIDs: [Principal] = [
    Principal.fromText("vpc3m-wzddq-dsg7w-gukqt-on5d3-akbzu-cz7l7-ytvu3-2dtkd-ksrdc-uae"),
    // Add more allowed PIDs here
  ];

  // Function to check if the caller is allowed
  private func isCallerAllowed(caller: Principal) : Bool {
    return Array.size<Principal>(
      Array.filter<Principal>(allowedPIDs, func(pid: Principal) : Bool {
        pid == caller
      })
    ) > 0;
  };

  // Function to submit a message
  public shared(msg) func submitMessage(recipient: Principal, subject: Text, message: Text) : async Text {
    let sender = msg.caller;
    let timestamp = Time.now();
    let newMessage = {
      sender = sender;
      recipient = recipient;
      subject = subject;
      message = message;
      timestamp = timestamp;
      viewed = false;
    };
    messages := Array.append<Message>(messages, [newMessage]);
    return "Message submitted successfully.";
  };

  // Helper function to mark messages as viewed and update storage
  private func markMessagesAsViewedAndUpdateStorage(msgs: [Message]) : [Message] {
    var updatedMessages = false;
    let viewedMessages = Array.map<Message, Message>(msgs, func (m) : Message {
      if (not m.viewed) {
        updatedMessages := true;
        {m with viewed = true};
      } else {
        m;
      }
    });
    if (updatedMessages) {
      messages := Array.map<Message, Message>(messages, func (m) : Message {
        if (Array.find<Message>(viewedMessages, func (v) : Bool { v == m }) != null) {
          {m with viewed = true};
        } else {
          m;
        }
      });
    };
    return viewedMessages;
  };

  // Function to filter messages based on the caller's PID and mark them as viewed
  private func filterMessagesByPidAndMarkViewed(caller: Principal, msgs: [Message]) : [Message] {
    let relevantMessages = Array.filter<Message>(msgs, func (m) : Bool {
      m.sender == caller or m.recipient == caller
    });
    return markMessagesAsViewedAndUpdateStorage(relevantMessages);
  };

  // Updated function to count messages relevant to the caller
  public shared(msg) func getTotalMessages() : async Nat {
    let caller = msg.caller;
    let relevantMessages = filterMessagesByPidAndMarkViewed(caller, messages);
    return Array.size<Message>(relevantMessages);
  };

  // Function to search messages by PID
  public shared(msg) func searchByPid(pid: Principal) : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(messages, func (m) : Bool {
      (m.sender == pid or m.recipient == pid) and (m.sender == caller or m.recipient == caller)
    });
    return markMessagesAsViewedAndUpdateStorage(results);
  };

  // Function to search messages by subject
  public shared(msg) func searchBySubject(subject: Text) : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(messages, func (m) : Bool {
      m.subject == subject and (m.sender == caller or m.recipient == caller)
    });
    return markMessagesAsViewedAndUpdateStorage(results);
  };

  // Function to search messages by timestamp
  public shared(msg) func searchByTimestamp(fromTimestamp: Time.Time, toTimestamp: Time.Time) : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(messages, func (m) : Bool {
      m.timestamp >= fromTimestamp and m.timestamp <= toTimestamp and (m.sender == caller or m.recipient == caller)
    });
    return markMessagesAsViewedAndUpdateStorage(results);
  };

  // Function to get all messages, restricted by caller PID
  public shared(msg) func getAllMessages() : async [Message] {
    let caller = msg.caller;
    if (isCallerAllowed(caller)) {
      let relevantMessages = filterMessagesByPidAndMarkViewed(caller, messages);
      return relevantMessages;
    } else {
      Debug.trap("Unauthorized access: Caller is not allowed to retrieve all messages.");
    }
  };

  // Function to get messages that haven't been viewed yet
  public shared(msg) func getUnviewedMessages() : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(messages, func (m) : Bool {
      not m.viewed and (m.sender == caller or m.recipient == caller)
    });
    return markMessagesAsViewedAndUpdateStorage(results);
  };

  // Function to mark a message as viewed manually
  public shared(msg) func markAsViewed(subject: Text) : async Text {
    let caller = msg.caller;
    var found = false;
    messages := Array.map<Message, Message>(messages, func (m) : Message {
      if (m.subject == subject and m.recipient == caller) {
        found := true;
        {m with viewed = true};
      } else {
        m;
      }
    });
    if (found) {
      return "Message marked as viewed.";
    } else {
      return "Message not found or unauthorized.";
    }
  };

  // Function to delete an individual message
  public shared(msg) func deleteMessage(subject: Text) : async Text {
    let caller = msg.caller;
    let initialLength = Array.size<Message>(messages);
    messages := Array.filter<Message>(messages, func (m) : Bool {
      not (m.subject == subject and m.recipient == caller)
    });
    if (Array.size<Message>(messages) < initialLength) {
      return "Message deleted successfully.";
    } else {
      return "Message not found or unauthorized.";
    }
  };

  // Function to delete all messages that have been viewed
  public shared(msg) func deleteViewedMessages() : async Text {
    let caller = msg.caller;
    let initialLength = Array.size<Message>(messages);
    messages := Array.filter<Message>(messages, func (m) : Bool {
      not (m.viewed and m.recipient == caller)
    });
    let deletedCount = initialLength - Array.size<Message>(messages);
    if (deletedCount > 0) {
      return "Viewed message(s) deleted successfully. Total deleted: " # Nat.toText(deletedCount);
    } else {
      return "No viewed messages to delete or unauthorized.";
    }
  };

  // Function to get all messages where the caller is the recipient
  public shared(msg) func getMyMessages() : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(messages, func (m) : Bool {
      m.recipient == caller
    });
    return markMessagesAsViewedAndUpdateStorage(results);
  };

  // Function to get all messages where the caller is the sender
  public shared(msg) func getSentMessages() : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(messages, func (m) : Bool {
      m.sender == caller
    });
    return results;
  };
};
