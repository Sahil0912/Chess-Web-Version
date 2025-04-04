# Chess Web Version

A modern twist on the classic chess game built using HTML, CSS, and JavaScript. This web version of chess not only supports all the original moves and rules but also introduces two innovative moves to spice up the gameplay:

- **Rook Special Move:** The rook can move only a prime number of squares.
- **Bishop Special Move:** The bishop can jump over a single pawn if needed.

## Features

- **Classic Chess Rules:** All standard chess moves and rules are implemented.
- **Innovative Moves:**
  - *Rook*: Movement limited to a prime number of squares.
  - *Bishop*: Ability to jump over one pawn when required.
- **Responsive Design:** Enjoy the game on various devices with a responsive UI.
- **CI Integration:** Automated testing and continuous integration ensure stability and code quality.

## Getting Started

Follow these instructions to set up and run the Chess Web Version locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (tested for 18.x and 20.x)
- npm (comes with Node.js)

### Installation

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/Sahil0912/Chess_Web_Version.git
   
    cd Chess_Web_Version
    ```
2. **Running the Game**
- *Start the server*

    ```bash
    npm start

- *Open the Game in Your Browser:*

    Navigate to http://localhost:3000/login.html to begin playing.

## Testing and CI
- **Automated Tests:** Tests have been integrated into the project to ensure each feature works as expected.
 - **Continuous Integration:** The project is set up with CI to automatically run tests on each commit, ensuring ongoing code quality and stability.

## Technologies Used

- **HTML, CSS, and JavaScript:** For building the front-end user interface.
- **Node.js:** The runtime environment for executing JavaScript on the server.
- **Express:** A minimalist web framework used to handle server routing and middleware.
- **Body-Parser:** Middleware for parsing JSON payloads from incoming requests.
- **bcryptjs:** A library used for hashing and securely comparing passwords.
- **fs (File System) & path:** Built-in Node.js modules used for file operations and managing file paths.
- **Mocha:** A JavaScript testing framework used for running tests.
- **npm:** The package manager used for managing dependencies and running scripts.
- **Continuous Integration (CI):** Automated CI tools integrated into the repository to run tests and maintain code quality.

