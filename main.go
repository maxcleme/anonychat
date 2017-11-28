package main

import (
	"net/http"
	"github.com/gorilla/websocket"
	"github.com/gorilla/mux"
	"log"
	"encoding/json"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type room struct {
	Users map[string]*websocket.Conn
}

type Message struct {
	UserId      string      `json:"userId"`
	RecipientId string      `json:"recipientId"`
	Data        MessageInfo `json:"Data"`
}

type MessageInfo struct {
	MessageType string       `json:"MessageType"`
	Content     *interface{} `json:"Content"`
}

func removeUserFromRoom(hub map[string]*room, roomName string, userId string) {
	delete(hub[roomName].Users, userId)
	if len(hub[roomName].Users) == 0 {
		delete(hub, roomName)
	}
}

func main() {
	// hub
	hub := make(map[string]*room)

	server := mux.NewRouter()
	server.HandleFunc("/ws/{roomName:(?:.*?)+}", func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		roomName := params["roomName"]

		if _, ok := hub[roomName]; !ok {
			hub[roomName] = &room{
				Users: make(map[string]*websocket.Conn),
			}
		}

		room := hub[roomName];
		conn, err := upgrader.Upgrade(w, r, nil)

		if err != nil {
			log.Println(err)
			return
		}
		for {
			messageType, p, err := conn.ReadMessage()
			if err != nil {
				log.Println(err)
				return
			}
			var msg Message
			err = json.Unmarshal(p, &msg)
			if err != nil {
				log.Println(err)
				return
			}

			if _, ok := room.Users[msg.UserId]; !ok {
				conn.SetCloseHandler(func(code int, text string) error {
					removeUserFromRoom(hub, roomName, msg.UserId)
					return nil
				})
				room.Users[msg.UserId] = conn
			}

			if len(msg.RecipientId) != 0 {
				// One to one
				if _, ok := room.Users[msg.RecipientId]; ok {
					err = room.Users[msg.RecipientId].WriteMessage(messageType, p)
					if err != nil {
						removeUserFromRoom(hub, roomName, msg.RecipientId)
						log.Println(err)
					}
				}
			} else {
				// One to many
				for userId, userConn := range room.Users {
					if userId != msg.UserId {
						err = userConn.WriteMessage(messageType, p)
						if err != nil {
							removeUserFromRoom(hub, roomName, userId)
							log.Println(err)
						}
					}
				}
			}
		}
	})
	http.Handle("/", server)
	http.ListenAndServe(":8080", nil)

}
