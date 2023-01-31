# This is the idea of what could be built with an optimizable GPT3:

current_state = State()
instruction = "Send an email to jack"
test = "email to jack appears in the Sent tab of gmail"

# Between 0 and 1 (1 means done)
current_done_rating = 0

while current_done_rating == 1:
    commands = GPT3(
        "How to do this:",
        instruction
    )
    current_state.apply(commands)
    current_done_rating = GPT3(
        "Was this done? Rank on a scale of 0 to 1, 1 being done and 0 being not done at all",
        test,
        current_state
    )
    GPT3.optimize_for_commands(commands, current_done_rating)
