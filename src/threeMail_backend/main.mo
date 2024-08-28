import Array "mo:base/Array";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";

actor class Mailbox() = this {
  type Message = {
    sender: Principal;
    recipient: Principal;
    senderCustomAddress: ?Text;
    subject: Text;
    message: Text;
    timestamp: Time.Time;
    viewed: Bool;
  };

  stable var messages: [Message] = [];
  stable var totalMessagesSent: Nat = 0;
  stable var usernames: [(Principal, Text)] = [];

  public shared(msg) func submitMessage(recipient: Principal, subject: Text, message: Text) : async Text {
    let sender = msg.caller;
    let senderCustomAddress = await getUsername(sender);  // Ensure we await the result
    let timestamp = Time.now();
    let newMessage = {
      sender = sender;
      recipient = recipient;
      senderCustomAddress = senderCustomAddress;
      subject = subject;
      message = message;
      timestamp = timestamp;
      viewed = false;
    };
    messages := Array.append<Message>(messages, [newMessage]);
    totalMessagesSent += 1;
    return "Message submitted successfully.";
  };

  public shared(msg) func getTotalMessages() : async Nat {
    let caller = msg.caller;
    let receivedMessages = Array.filter<Message>(messages, func (m) : Bool {
      m.recipient == caller
    });
    return Array.size<Message>(receivedMessages);
  };

  public shared(msg) func getTotalMessagesSent() : async Nat {
    return totalMessagesSent;
  };

  public shared(msg) func getMyMessages() : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(messages, func (m) : Bool {
      m.recipient == caller
    });
    return sortMessagesByTimestamp(results);
  };

  public shared(msg) func getUnviewedMessages() : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(messages, func (m) : Bool {
      not m.viewed and m.recipient == caller
    });
    return sortMessagesByTimestamp(results);
  };

  public shared(msg) func getSentMessages() : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(messages, func (m) : Bool {
      m.sender == caller
    });
    return sortMessagesByTimestamp(results);
  };

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

  public shared(msg) func deleteAllMessages() : async Text {
    let caller = msg.caller;
    let initialLength = Array.size<Message>(messages);
    messages := Array.filter<Message>(messages, func (m) : Bool {
      m.recipient != caller
    });
    let deletedCount = initialLength - Array.size<Message>(messages);
    if (deletedCount > 0) {
      return "All messages deleted successfully.";
    } else {
      return "No messages to delete or unauthorized.";
    }
  };

  public shared(msg) func searchBySubject(subject: Text) : async [Message] {
    let caller = msg.caller;
    let results = Array.filter<Message>(messages, func (m) : Bool {
      m.subject == subject and (m.sender == caller or m.recipient == caller)
    });
    return sortMessagesByTimestamp(results);
  };

  public shared(msg) func setUsername(newUsername: Text) : async Bool {
    let caller: Principal = msg.caller;
    let lowerUsername = Text.toLowercase(newUsername);

    // Check if username already exists (case insensitive)
    let usernameExists = Array.find<Text>(
      Array.map<(Principal, Text), Text>(usernames, func(entry) { Text.toLowercase(entry.1) }),
      func(name) { name == lowerUsername }
    ) != null;

    if (usernameExists) {
      return false;
    } else {
      // Remove any existing username associated with the caller
      usernames := Array.filter(usernames, func(entry: (Principal, Text)) : Bool { entry.0 != caller });
      usernames := Array.append(usernames, [(caller, newUsername)]);
      return true;
    }
  };

  public query func getUsername(userId: Principal) : async ?Text {
    let result = Array.find<(Principal, Text)>(usernames, func(entry: (Principal, Text)) : Bool {
      entry.0 == userId
    });
    return switch result {
      case (?entry) ?entry.1;
      case null null;
    };
  };

  public query func resolveCustomAddress(customAddress: Text) : async ?Principal {
    let lowerCustomAddress = Text.toLowercase(customAddress);
    let result = Array.find<(Principal, Text)>(usernames, func(entry: (Principal, Text)) : Bool {
      Text.toLowercase(entry.1) == lowerCustomAddress
    });
    return switch result {
      case (?entry) ?entry.0;
      case null null;
    };
  };

  // Custom sorting function with custom order type
  type CustomOrder = {
    #less;
    #equal;
    #greater;
  };

  func compareTimestamps(a: Time.Time, b: Time.Time) : CustomOrder {
    if (a < b) {
      return #greater;
    } else if (a > b) {
      return #less;
    } else {
      return #equal;
    }
  };

  func sortMessagesByTimestamp(messages: [Message]) : [Message] {
    return Array.sort<Message>(messages, func (a, b) : CustomOrder {
      compareTimestamps(a.timestamp, b.timestamp)
    });
  };
};
